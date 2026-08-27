// api/line-notify.js
export default async function handler(req, res) {
    // กำหนด CORS Headers เพื่อให้ Frontend สามารถยิง API ข้ามโดเมน (ถ้าจำเป็น) หรือป้องกัน Method อื่นๆ
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { type, lineUserId, message, orderDetails } = req.body;
    const LINE_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN; // ตั้งค่าใน Environment Variables ของ Vercel[cite: 3]

    if (!lineUserId) {
        return res.status(400).json({ success: false, error: 'Missing lineUserId' });
    }

    let textMessage = message;
    if (type === 'new_order') {
        textMessage = `🔔 มีคำสั่งซื้อใหม่!\n- ยอดรวม: ฿${orderDetails?.totalAmount || 0}\n- วิธีชำระ: ${orderDetails?.paymentMethod || '-'}`;
    } else if (type === 'tracking') {
        textMessage = `📦 พัสดุของคุณถูกจัดส่งแล้ว!\n- ขนส่ง: ${orderDetails?.carrier || '-'}\n- หมายเลขพัสดุ: ${orderDetails?.trackingNo || '-'}\nตรวจสอบสถานะได้เลยครับ`;
    }

    try {
        // ยิงหาผู้ใช้รายบุคคลผ่าน LINE Messaging API (Push Message)[cite: 3]
        const response = await fetch('https://api.line.me/v2/bot/message/push', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${LINE_ACCESS_TOKEN}`
            },
            body: JSON.stringify({
                to: lineUserId, // LINE User ID ของลูกค้าหรือร้านค้า[cite: 3]
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
