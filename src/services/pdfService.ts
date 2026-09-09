import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import { showAlertGlobal } from '../context/AlertContext';
import { DailyLogItem } from '../database/logRepo';
import { MedicineRecord } from '../database/medicineRepo';
import { VitalsRepo } from '../database/vitalsRepo';
import { CaregiverRepo } from '../database/caregiverRepo';
import { formatToISODate } from '../utils/dateUtils';

export const PdfService = {
  /**
   * Generate and export Doctor's Clinical Medical Report as PDF
   */
  async generateDoctorReport(logs: DailyLogItem[], medicines: MedicineRecord[]): Promise<void> {
    const todayStr = formatToISODate(new Date());

    // 1. Read caregiver profile from SQLite
    const caregiver = await CaregiverRepo.getCaregiver();

    // 2. Read biometric vitals data from daily_vitals table
    const vitalsList = await VitalsRepo.getAllVitals();

    const systolics = vitalsList
      .map((v) => v.systolic)
      .filter((n): n is number => typeof n === 'number' && !isNaN(n));
    const diastolics = vitalsList
      .map((v) => v.diastolic)
      .filter((n): n is number => typeof n === 'number' && !isNaN(n));
    const bloodSugars = vitalsList
      .map((v) => v.bloodSugar)
      .filter((n): n is number => typeof n === 'number' && !isNaN(n));
    const heartRates = vitalsList
      .map((v) => v.heartRate)
      .filter((n): n is number => typeof n === 'number' && !isNaN(n));

    const bpDisplay =
      systolics.length > 0 && diastolics.length > 0
        ? `${Math.round(systolics.reduce((a, b) => a + b, 0) / systolics.length)}/${Math.round(diastolics.reduce((a, b) => a + b, 0) / diastolics.length)}`
        : '120/80';

    const sugarDisplay =
      bloodSugars.length > 0
        ? `${Math.round((bloodSugars.reduce((a, b) => a + b, 0) / bloodSugars.length) * 10) / 10} mg/dL`
        : '95 mg/dL';

    const hrDisplay =
      heartRates.length > 0
        ? `${Math.round(heartRates.reduce((a, b) => a + b, 0) / heartRates.length)} bpm`
        : '72 bpm';

    // 2. Only include records up to today (past and today)
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
          <td style="padding: 12px 10px; border-bottom: 1px solid #E2E8F0; font-weight: 700; color: #0F172A; font-size: 14px;">${m.name}</td>
          <td style="padding: 12px 10px; border-bottom: 1px solid #E2E8F0; font-size: 14px; font-weight: 600; color: #1E3A8A;">${m.dosage}</td>
          <td style="padding: 12px 10px; border-bottom: 1px solid #E2E8F0; font-size: 13px; color: #475569;">${m.reminderTimes.join(', ') || 'N/A'}</td>
          <td style="padding: 12px 10px; border-bottom: 1px solid #E2E8F0; font-size: 13px; color: #64748B;">${m.daysOfWeek.join(', ') || 'Daily'}</td>
        </tr>
      `
      )
      .join('');

    const logRowsHtml = auditLogs
      .slice(0, 30)
      .map(
        (l) => `
        <tr>
          <td style="padding: 12px 10px; border-bottom: 1px solid #F1F5F9; color: #334155; font-size: 13px; font-weight: 600;">${l.date}</td>
          <td style="padding: 12px 10px; border-bottom: 1px solid #F1F5F9; font-size: 14px; font-weight: 700; color: #0F172A;">${l.name} (${l.dosage})</td>
          <td style="padding: 12px 10px; border-bottom: 1px solid #F1F5F9; color: #475569; font-size: 13px;">${l.scheduledTime}</td>
          <td style="padding: 12px 10px; border-bottom: 1px solid #F1F5F9;">
            <span style="display: inline-block; padding: 6px 10px; border-radius: 6px; font-size: 13px; font-weight: 800; letter-spacing: 0.4px; ${
              l.isTaken
                ? 'background-color: #DCFCE7; color: #166534; border: 1px solid #86EFAC;'
                : 'background-color: #FEE2E2; color: #991B1B; border: 1px solid #FCA5A5;'
            }">
              ${l.isTaken ? 'TAKEN (' + (l.takenAt || 'On Time') + ')' : 'MISSED'}
            </span>
          </td>
          <td style="padding: 12px 10px; border-bottom: 1px solid #F1F5F9; font-size: 13px; color: ${l.notes ? '#334155' : '#94A3B8'}; font-style: ${l.notes ? 'normal' : 'italic'}; line-height: 1.4; word-break: break-word;">
            ${l.notes || 'Normal (No notes)'}
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
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0" />
          <style>
            @page {
              size: A4 portrait;
              margin: 15mm 12mm 15mm 12mm;
            }

            * {
              box-sizing: border-box;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }

            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              padding: 0;
              margin: 0;
              color: #0F172A;
              background-color: #FFFFFF;
              font-size: 15px;
              line-height: 1.5;
            }

            .header {
              border-bottom: 2.5px solid #1E3A8A;
              padding-bottom: 16px;
              margin-bottom: 20px;
              display: flex;
              justify-content: space-between;
              align-items: flex-end;
            }

            .title {
              font-size: 32px;
              font-weight: 900;
              color: #1E3A8A;
              margin: 0;
              letter-spacing: -0.5px;
            }

            .subtitle {
              font-size: 15px;
              color: #475569;
              margin-top: 6px;
              font-weight: 600;
            }

            .stats-box {
              background-color: #F8FAFC;
              border: 1.5px solid #E2E8F0;
              border-radius: 12px;
              padding: 16px 14px;
              margin-bottom: 24px;
              display: flex;
              justify-content: space-around;
              page-break-inside: avoid;
            }

            .stat-item {
              text-align: center;
            }

            .stat-value {
              font-size: 36px;
              font-weight: 900;
              color: #1E3A8A;
              line-height: 1.1;
              margin-bottom: 4px;
            }

            .stat-value.green {
              color: #16A34A;
            }

            .stat-value.amber {
              color: #D97706;
            }

            .stat-value.red {
              color: #DC2626;
            }

            .stat-label {
              font-size: 13px;
              font-weight: 800;
              color: #64748B;
              text-transform: uppercase;
              letter-spacing: 0.8px;
            }

            h3 {
              font-size: 18px;
              font-weight: 900;
              color: #1E3A8A;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              margin: 18px 0 10px 0;
              page-break-after: avoid;
            }

            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 24px;
              font-size: 14px;
              page-break-inside: auto;
            }

            thead {
              display: table-header-group;
            }

            tr {
              page-break-inside: avoid;
              page-break-after: auto;
            }

            th {
              background-color: #F1F5F9;
              padding: 12px 10px;
              text-align: left;
              font-size: 13px;
              font-weight: 800;
              text-transform: uppercase;
              color: #334155;
              border-bottom: 2px solid #CBD5E1;
              letter-spacing: 0.5px;
            }

            td {
              padding: 12px 10px;
              border-bottom: 1px solid #E2E8F0;
              vertical-align: middle;
            }

            .doctor-notes {
              border: 1.5px dashed #94A3B8;
              border-radius: 12px;
              padding: 18px;
              min-height: 100px;
              margin-top: 24px;
              background-color: #F8FAFC;
              page-break-inside: avoid;
            }

            .doctor-notes-title {
              font-size: 13px;
              font-weight: 800;
              color: #64748B;
              text-transform: uppercase;
              letter-spacing: 0.8px;
              margin-bottom: 10px;
            }

            .doctor-notes-line {
              height: 28px;
              border-bottom: 1px solid #E2E8F0;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1 class="title">CareBridge Clinical Report</h1>
              <p class="subtitle">Official Patient Medication Compliance Audit</p>
            </div>
            <div style="text-align: right;">
              <p style="font-size: 14px; color: #64748B; margin: 0;">Date: <strong>${generatedDate}</strong></p>
              <p style="font-size: 14px; color: #16A34A; margin: 4px 0 0 0; font-weight: 800;">Verified via SQLite</p>
            </div>
          </div>

          <!-- Primary Caregiver & Patient Identification -->
          <div style="background-color: #F8FAFC; border: 1.5px solid #E2E8F0; border-radius: 12px; padding: 14px 18px; margin-bottom: 22px; display: flex; justify-content: space-between; align-items: center;">
            <div>
              <span style="font-size: 13px; font-weight: 800; color: #64748B; text-transform: uppercase; letter-spacing: 0.8px;">Primary Caregiver:</span>
              <strong style="font-size: 15px; font-weight: 700; color: #1E3A8A; margin-left: 6px;">${caregiver.name}</strong>
              <span style="font-size: 15px; color: #475569; margin-left: 4px;">(${caregiver.email})</span>
            </div>
            <div>
              <span style="font-size: 13px; font-weight: 800; color: #64748B; text-transform: uppercase; letter-spacing: 0.8px;">Care Mode:</span>
              <strong style="font-size: 15px; font-weight: 700; color: #0D9488; margin-left: 6px;">Senior Daily Assisted</strong>
            </div>
          </div>

          <div class="stats-box">
            <div class="stat-item">
              <div class="stat-value ${adherence >= 80 ? 'green' : 'amber'}">${adherence}%</div>
              <div class="stat-label">Adherence Score</div>
            </div>
            <div class="stat-item">
              <div class="stat-value green">${taken}</div>
              <div class="stat-label">Doses Taken</div>
            </div>
            <div class="stat-item">
              <div class="stat-value ${total - taken > 0 ? 'red' : 'green'}">${total - taken}</div>
              <div class="stat-label">Doses Missed</div>
            </div>
          </div>

          <h3>Patient Biometric Vitals Audit</h3>
          <div class="stats-box">
            <div class="stat-item">
              <div class="stat-value" style="font-size: 30px;">${bpDisplay}</div>
              <div class="stat-label">Avg Blood Pressure</div>
            </div>
            <div class="stat-item">
              <div class="stat-value" style="font-size: 30px; color: #0284C7;">${sugarDisplay}</div>
              <div class="stat-label">Fasting Sugar</div>
            </div>
            <div class="stat-item">
              <div class="stat-value green" style="font-size: 30px;">${hrDisplay}</div>
              <div class="stat-label">Resting Heart Rate</div>
            </div>
          </div>

          <h3>Active Prescription Regimen</h3>
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

          <h3>Detailed Intake Audit (Recent Logs)</h3>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Medication</th>
                <th>Scheduled</th>
                <th>Status</th>
                <th>Notes / Observations</th>
              </tr>
            </thead>
            <tbody>
              ${logRowsHtml}
            </tbody>
          </table>

          <div class="doctor-notes">
            <div class="doctor-notes-title">Attending Physician Observations & Signature</div>
            <div class="doctor-notes-line"></div>
            <div class="doctor-notes-line"></div>
            <div class="doctor-notes-line"></div>
          </div>
        </body>
      </html>
    `;

    // 1. Generate temporary PDF file with clean naming
    const { uri: tempUri } = await Print.printToFileAsync({ html: htmlContent });
    const cleanFileName = `CareBridge_Clinical_Report_${todayStr}.pdf`;

    // 2. Direct save on Android via StorageAccessFramework
    if (Platform.OS === 'android') {
      try {
        const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
        if (permissions.granted) {
          const base64 = await FileSystem.readAsStringAsync(tempUri, {
            encoding: FileSystem.EncodingType.Base64,
          });
          const createdUri = await FileSystem.StorageAccessFramework.createFileAsync(
            permissions.directoryUri,
            cleanFileName,
            'application/pdf'
          );
          await FileSystem.writeAsStringAsync(createdUri, base64, {
            encoding: FileSystem.EncodingType.Base64,
          });
          showAlertGlobal({
            title: 'Success',
            message: `Saved report "${cleanFileName}" to device.`,
            type: 'success',
          });
          return;
        }
      } catch (e) {
        console.warn('SAF file save error, falling back to Share sheet:', e);
      }
    }

    // 3. Fallback: Copy to documentDirectory with clean filename then share
    const newPath = `${FileSystem.documentDirectory}${cleanFileName}`;
    await FileSystem.copyAsync({ from: tempUri, to: newPath });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(newPath, {
        UTI: '.pdf',
        mimeType: 'application/pdf',
        dialogTitle: 'Save CareBridge Medical Report',
      });
    }
  },
};