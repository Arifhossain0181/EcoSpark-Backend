import Stripe from "stripe";
import { prisma } from "../../config/Prisma";
import { PaymentStatus } from "../../generated/prisma/enums";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
export const initPayment = async (userId, ideaId) => {
    const idea = await prisma.idea.findUnique({
        where: { id: ideaId },
    });
    if (!idea) {
        throw new Error("Idea not found");
    }
    if (!idea.isPaid) {
        throw new Error("Idea is free to view");
    }
    if (idea.authorId === userId) {
        throw new Error("You are the creator of this idea. Payment is not required.");
    }
    const user = await prisma.user.findUnique({
        where: { id: userId },
    });
    if (!user) {
        throw new Error("User not found");
    }
    //Already paid
    const existingPayment = await prisma.payment.findFirst({
        where: {
            userId,
            ideaId,
            status: PaymentStatus.SUCCESS,
        },
    });
    if (existingPayment) {
        throw new Error("Payment already exists");
    }
    // Create a pending payment record
    const payment = await prisma.payment.create({
        data: {
            userId,
            ideaId,
            amount: idea.price,
            status: PaymentStatus.PENDING,
        },
    });
    // Create Stripe checkout session (use USD to avoid too-small-amount errors)
    const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        mode: "payment",
        customer_email: user.email,
        metadata: {
            paymentId: payment.id,
            userId,
            ideaId,
        },
        line_items: [
            {
                price_data: {
                    currency: "usd",
                    unit_amount: Math.round(idea.price * 100), // cents
                    product_data: {
                        name: idea.title,
                        description: idea.description,
                    },
                },
                quantity: 1,
            },
        ],
        success_url: `${process.env.CLIENT_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.CLIENT_URL}/payment-cancelled`,
    });
    await prisma.payment.update({
        where: { id: payment.id },
        data: {
            tranId: session.id,
        },
    });
    return { url: session.url, paymentId: payment.id };
};
export const handleWebhook = async (payload, sig) => {
    let event;
    try {
        event = stripe.webhooks.constructEvent(payload, sig, process.env.STRIPE_WEBHOOK_SECRET);
    }
    catch (err) {
        throw new Error(`Webhook Error: ${err.message}`);
    }
    if (event.type === "checkout.session.completed") {
        const session = event.data.object;
        const paymentId = session.metadata;
        await prisma.payment.update({
            where: { id: paymentId.paymentId },
            data: {
                status: PaymentStatus.SUCCESS,
            },
        });
    }
    if (event.type === "checkout.session.expired") {
        const session = event.data.object;
        const paymentId = session.metadata;
        await prisma.payment.update({
            where: { id: paymentId.paymentId },
            data: {
                status: PaymentStatus.FAILED,
            },
        });
    }
    return { received: true };
};
//verify session for frontend
export const verifySession = async (sessionId, userId) => {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status !== "paid") {
        throw new Error("Payment not processed");
    }
    const payment = await prisma.payment.findFirst({
        where: { tranId: sessionId, userId },
    });
    if (!payment) {
        throw new Error("Payment record not found");
    }
    if (payment.status !== PaymentStatus.SUCCESS) {
        await prisma.payment.update({
            where: { id: payment.id },
            data: { status: PaymentStatus.SUCCESS, }
        });
    }
    return { message: "Payment verified successfully", ideaId: payment.ideaId };
};
// check if user has access to paid idea 
export const checkAccess = async (ideaId, userId) => {
    const idea = await prisma.idea.findUnique({
        where: { id: ideaId },
    });
    if (!idea) {
        throw new Error("Idea not found");
    }
    if (!idea.isPaid) {
        return { hasAccess: true, message: "This idea is free to view" };
    }
    if (idea.authorId === userId) {
        return { hasAccess: true, message: "Access granted as the idea creator" };
    }
    const payment = await prisma.payment.findFirst({
        where: {
            userId,
            ideaId,
            status: PaymentStatus.SUCCESS,
        },
    });
    return { hasAccess: !!payment, message: payment ? "Access granted" : "Access denied. Please purchase to view this idea." };
};
export const getAllPaymentsForAdmin = async () => {
    const payments = await prisma.payment.findMany({
        include: {
            user: {
                select: {
                    name: true,
                    email: true,
                },
            },
            idea: {
                select: {
                    title: true,
                },
            },
        },
        orderBy: {
            createdAt: "desc",
        },
    });
    return payments;
};
export const getMyPurchasedIdeas = async (userId) => {
    const payments = await prisma.payment.findMany({
        where: {
            userId,
            status: PaymentStatus.SUCCESS,
        },
        include: {
            idea: {
                include: {
                    category: true,
                    _count: {
                        select: {
                            votes: true,
                            comments: true,
                        },
                    },
                },
            },
        },
        orderBy: {
            createdAt: "desc",
        },
    });
    const seenIdeaIds = new Set();
    const uniquePurchasedIdeas = [];
    for (const payment of payments) {
        if (seenIdeaIds.has(payment.ideaId)) {
            continue;
        }
        seenIdeaIds.add(payment.ideaId);
        uniquePurchasedIdeas.push({
            id: payment.idea.id,
            title: payment.idea.title,
            status: payment.idea.status,
            category: payment.idea.category
                ? { id: payment.idea.category.id, name: payment.idea.category.name }
                : null,
            isPaid: Boolean(payment.idea.isPaid),
            price: Number(payment.idea.price ?? payment.amount ?? 0),
            createdAt: payment.idea.createdAt,
            purchasedAt: payment.createdAt,
            _count: {
                votes: payment.idea._count?.votes ?? 0,
                comments: payment.idea._count?.comments ?? 0,
            },
        });
    }
    return uniquePurchasedIdeas;
};
