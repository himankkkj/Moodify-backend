export function generateOtp() {
    const otp = Math.floor(100000 + Math.random() * 900000);
    return otp;
}

export function getOtpHtml(otp) {
    return `<!doctype html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Your Moodify verification code</title>
</head>
<body style="margin:0;background:#f4f1eb;color:#1d2925;font-family:Arial,sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:32px 16px;background:#f4f1eb;">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;background:#ffffff;border:1px solid #dedbd3;">
                    <tr>
                        <td style="padding:32px 36px;background:#173c35;color:#ffffff;">
                            <p style="margin:0 0 8px;font-size:13px;letter-spacing:2px;text-transform:uppercase;color:#b8d7c1;">Moodify</p>
                            <h1 style="margin:0;font-size:28px;line-height:1.2;font-weight:600;">Verify your email</h1>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:36px;">
                            <p style="margin:0 0 16px;font-size:16px;line-height:1.6;">Use the verification code below to finish setting up your account.</p>
                            <div style="margin:28px 0;padding:20px;text-align:center;background:#f1f6f0;border:1px solid #c9dfcc;">
                                <span style="font-size:34px;line-height:1;letter-spacing:8px;font-weight:700;color:#173c35;">${otp}</span>
                            </div>
                            <p style="margin:0;font-size:14px;line-height:1.6;color:#68736d;">This code expires soon. If you did not request it, you can safely ignore this email.</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;
}