import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { DailyLogItem } from '../database/logRepo';
import { MedicineRecord } from '../database/medicineRepo';

export const PdfService = {
  /**
   * Generate and export Doctor's Clinical Medical Report as PDF
   */
  async generateDoctorReport(logs: DailyLogItem[], medicines: MedicineRecord[]): Promise<void> {
    const todayStr = new Date().toISOString().split('T')[0];

    // 1. Only include records up to today (past and today)
    const auditLogs = logs.filter((l) => l.date <= todayStr);

    const total = auditLogs.length;
    const taken = auditLogs.filter((l) => l.isTaken).length;
    const adherence = total > 0 ? Math.round((taken / total) * 100) : 100;
    const generatedDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const medicineRowsHtml = medicines
      .map(
        (m) => `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #E2E8F0; font-weight: bold; color: #1E293B;">${m.name}</td>
          <td style="padding: 10px; border-bottom: 1px solid #E2E8F0; color: #475569;">${m.dosage}</td>
          <td style="padding: 10px; border-bottom: 1px solid #E2E8F0; color: #475569;">${m.reminderTimes.join(', ')}</td>
          <td style="padding: 10px; border-bottom: 1px solid #E2E8F0; color: #475569;">${m.daysOfWeek.join(', ')}</td>
        </tr>
      `
      )
      .join('');

    const logRowsHtml = auditLogs
      .slice(0, 20)
      .map(
        (l) => `
        <tr>
          <td style="padding: 8px 10px; border-bottom: 1px solid #F1F5F9; color: #1E293B;">${l.date}</td>
          <td style="padding: 8px 10px; border-bottom: 1px solid #F1F5F9; font-weight: 600;">${l.name} (${l.dosage})</td>
          <td style="padding: 8px 10px; border-bottom: 1px solid #F1F5F9; color: #64748B;">${l.scheduledTime}</td>
          <td style="padding: 8px 10px; border-bottom: 1px solid #F1F5F9;">
            <span style="display: inline-block; padding: 4px 8px; border-radius: 6px; font-size: 11px; font-weight: bold; ${
              l.isTaken
                ? 'background-color: #DCFCE7; color: #16A34A;'
                : 'background-color: #FEE2E2; color: #DC2626;'
            }">
              ${l.isTaken ? 'TAKEN (' + (l.takenAt || 'On Time') + ')' : 'MISSED'}
            </span>
          </td>
        </tr>
      `
      )
      .join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 30px; color: #0F172A; }
            .header { border-bottom: 2px solid #1E3A8A; padding-bottom: 15px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-end; }
            .title { font-size: 24px; font-weight: 900; color: #1E3A8A; margin: 0; }
            .subtitle { font-size: 12px; color: #64748B; margin-top: 4px; }
            .stats-box { background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 15px; margin-bottom: 25px; display: flex; justify-content: space-around; }
            .stat-item { text-align: center; }
            .stat-value { font-size: 26px; font-weight: 900; color: #1E3A8A; }
            .stat-label { font-size: 11px; font-weight: bold; color: #64748B; text-transform: uppercase; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 25px; font-size: 13px; }
            th { background-color: #F1F5F9; padding: 10px; text-align: left; font-size: 11px; text-transform: uppercase; color: #475569; }
            .doctor-notes { border: 1.5px dashed #CBD5E1; border-radius: 10px; padding: 15px; height: 90px; margin-top: 20px; }
            .doctor-notes-title { font-size: 11px; font-weight: bold; color: #94A3B8; text-transform: uppercase; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1 class="title">CareBridge Clinical Report</h1>
              <p class="subtitle">Official Patient Medication Compliance Audit</p>
            </div>
            <div style="text-align: right;">
              <p style="font-size: 12px; color: #64748B; margin: 0;">Date: <strong>${generatedDate}</strong></p>
              <p style="font-size: 12px; color: #16A34A; margin: 2px 0 0 0; font-weight: bold;">Verified via SQLite</p>
            </div>
          </div>

          <div class="stats-box">
            <div class="stat-item">
              <div class="stat-value">${adherence}%</div>
              <div class="stat-label">Adherence Score</div>
            </div>
            <div class="stat-item">
              <div class="stat-value" style="color: #16A34A;">${taken}</div>
              <div class="stat-label">Doses Taken</div>
            </div>
            <div class="stat-item">
              <div class="stat-value" style="color: #DC2626;">${total - taken}</div>
              <div class="stat-label">Doses Missed</div>
            </div>
          </div>

          <h3 style="font-size: 14px; text-transform: uppercase; color: #1E3A8A; margin-bottom: 8px;">Active Prescription Regimen</h3>
          <table>
            <thead>
              <tr>
                <th>Medication</th>
                <th>Dosage</th>
                <th>Reminder Times</th>
                <th>Schedule</th>
              </tr>
            </thead>
            <tbody>
              ${medicineRowsHtml}
            </tbody>
          </table>

          <h3 style="font-size: 14px; text-transform: uppercase; color: #1E3A8A; margin-bottom: 8px;">Detailed Intake Audit (Last 20 Logs)</h3>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Medication</th>
                <th>Scheduled</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${logRowsHtml}
            </tbody>
          </table>

          <div class="doctor-notes">
            <div class="doctor-notes-title">Attending Physician Observations & Signature</div>
          </div>
        </body>
      </html>
    `;

    // 1. Generate temporary PDF file
    const { uri } = await Print.printToFileAsync({ html: htmlContent });

    // 2. Open system Share / Print dialog
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, {
        UTI: '.pdf',
        mimeType: 'application/pdf',
        dialogTitle: 'Share CareBridge Clinical PDF Report',
      });
    }
  },
};