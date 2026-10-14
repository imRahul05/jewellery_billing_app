import QRCode from "qrcode";

export interface UpiQrOptions {
  upiId: string;
  payeeName: string;
  amount?: number;
  invoiceNumber?: string;
  note?: string;
}

export function generateUpiUri({
  upiId,
  payeeName,
  amount,
  invoiceNumber,
  note,
}: UpiQrOptions): string {
  const cleanUpi = upiId.trim();
  const cleanName = encodeURIComponent(payeeName.trim());
  const cleanNote = encodeURIComponent(note || `Bill ${invoiceNumber || ""}`.trim());

  let uri = `upi://pay?pa=${cleanUpi}&pn=${cleanName}&cu=INR`;

  if (amount && amount > 0) {
    uri += `&am=${amount.toFixed(2)}`;
  }

  if (cleanNote) {
    uri += `&tn=${cleanNote}`;
  }

  return uri;
}

export async function generateUpiQrDataUrl(
  options: UpiQrOptions
): Promise<string> {
  if (!options.upiId) return "";
  try {
    const uri = generateUpiUri(options);
    const dataUrl = await QRCode.toDataURL(uri, {
      errorCorrectionLevel: "M",
      margin: 1,
      width: 240,
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
    });
    return dataUrl;
  } catch (err) {
    console.error("Failed to generate UPI QR code", err);
    return "";
  }
}
