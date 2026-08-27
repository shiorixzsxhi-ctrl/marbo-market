// api/line-notify.js
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { type, lineUserId, message, orderDetails } = req.body;
    const LINE_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN; // ตั้งค่าใน Environment Variables ของ Vercel

    let textMessage = message;
    if (type === 'new_order') {
        textMessage = `🔔 มีคำสั่งซื้อใหม่!\n- ยอดรวม: ฿${orderDetails.totalAmount}\n- วิธีชำระ: ${orderDetails.paymentMethod}`;
    } else if (type === 'tracking') {
        textMessage = `📦 พัสดุของคุณถูกจัดส่งแล้ว!\n- ขนส่ง: ${orderDetails.carrier}\n- หมายเลขพัสดุ: ${orderDetails.trackingNo}\nตรวจสอบสถานะได้เลยครับ`;
    }

    try {
        // ถ้ายิงหาผู้ใช้รายบุคคล (Push Message)
        const response = await fetch('https://api.line.me/v2/bot/message/push', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${LINE_ACCESS_TOKEN}`
            },
            body: JSON.stringify({
                to: lineUserId, // LINE User ID ของลูกค้าหรือร้านค้า
                messages: [{ type: 'text', text: textMessage }]
            })
        });

        const data = await response.json();
        if (response.ok) {
            return res.status(200).json({ success: true, data });
        } else {
            return res.status(500).json({ success: false, error: data });
        }
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}