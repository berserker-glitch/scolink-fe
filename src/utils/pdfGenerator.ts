import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Teacher, Group, Student } from '@/services/api';

export interface WeeklyScheduleData {
  teacher: Teacher;
  groups: Group[];
}

export const generateTeacherSchedulePDF = async (scheduleData: WeeklyScheduleData) => {
  try {
    // Create a temporary container for the schedule
    const scheduleContainer = document.createElement('div');
    scheduleContainer.style.position = 'absolute';
    scheduleContainer.style.top = '-9999px';
    scheduleContainer.style.left = '-9999px';
    scheduleContainer.style.width = '700px';
    scheduleContainer.style.backgroundColor = 'white';
    scheduleContainer.style.padding = '10px';
    scheduleContainer.style.fontFamily = 'Arial, sans-serif';
    
    // Generate the schedule HTML
    const scheduleHTML = generateScheduleHTML(scheduleData);
    scheduleContainer.innerHTML = scheduleHTML;
    
    // Append to body temporarily
    document.body.appendChild(scheduleContainer);
    
    // Generate canvas from HTML
    const canvas = await html2canvas(scheduleContainer, {
      backgroundColor: 'white',
      scale: 1.5,
      useCORS: true,
      allowTaint: true,
    });
    
    // Remove temporary container
    document.body.removeChild(scheduleContainer);
    
    // Create PDF (single page only)
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    // Calculate dimensions to fit A4 (single page)
    const imgWidth = 200; // A4 width in mm with margins
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    // If content is too tall, scale it down to fit one page
    const maxHeight = 280; // A4 height in mm with margins
    let finalWidth = imgWidth;
    let finalHeight = imgHeight;
    
    if (imgHeight > maxHeight) {
      finalHeight = maxHeight;
      finalWidth = (canvas.width * finalHeight) / canvas.height;
    }
    
    // Center the content on the page
    const x = (210 - finalWidth) / 2;
    const y = (297 - finalHeight) / 2;
    
    // Add single page
    pdf.addImage(imgData, 'PNG', x, y, finalWidth, finalHeight);
    
    // Save the PDF
    const fileName = `${scheduleData.teacher.name.replace(/\s+/g, '_')}_Schedule.pdf`;
    pdf.save(fileName);
    
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF');
  }
};

const generateScheduleHTML = (scheduleData: WeeklyScheduleData): string => {
  const { teacher, groups } = scheduleData;
  
  // Days of the week (all 7 days)
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  
  // Create a schedule grid
  const scheduleGrid: { [key: string]: { [key: string]: { group: string; subject: string; room: string }[] } } = {};
  
  // Get all unique time slots
  const timeSlots = new Set<string>();
  
  // Initialize grid and collect time slots
  groups.forEach(group => {
    group.schedules.forEach(schedule => {
      if (days.includes(schedule.day)) {
        const timeSlot = `${schedule.startTime} - ${schedule.endTime}`;
        timeSlots.add(timeSlot);
        
        if (!scheduleGrid[timeSlot]) {
          scheduleGrid[timeSlot] = {};
          days.forEach(day => {
            scheduleGrid[timeSlot][day] = [];
          });
        }
        
        scheduleGrid[timeSlot][schedule.day].push({
          group: group.name,
          subject: group.subjectName || 'Subject',
          room: group.classNumber
        });
      }
    });
  });
  
  // Sort time slots
  const sortedTimeSlots = Array.from(timeSlots).sort();
  
  return `
    <div style="font-family: Arial, sans-serif; padding: 15px; font-size: 12px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="margin: 0; font-size: 18px; font-weight: bold;">
          Weekly Schedule
        </h1>
        <h2 style="margin: 5px 0; font-size: 16px;">
          ${teacher.name}
        </h2>
        <p style="margin: 2px 0; font-size: 11px;">
          ${teacher.email}${teacher.phone ? ' • ' + teacher.phone : ''}
        </p>
      </div>
      
      <table style="width: 100%; border-collapse: collapse; border: 1px solid black; font-size: 10px;">
        <thead>
          <tr>
            <th style="border: 1px solid black; padding: 6px; font-weight: bold; text-align: center; width: 100px;">
              Time
            </th>
            ${days.map(day => `
              <th style="border: 1px solid black; padding: 6px; font-weight: bold; text-align: center;">
                ${day.substring(0, 3)}
              </th>
            `).join('')}
          </tr>
        </thead>
        <tbody>
          ${sortedTimeSlots.map(timeSlot => `
            <tr>
              <td style="border: 1px solid black; padding: 6px; text-align: center; font-weight: bold; vertical-align: middle;">
                ${timeSlot}
              </td>
              ${days.map(day => {
                const classes = scheduleGrid[timeSlot][day];
                return `
                  <td style="border: 1px solid black; padding: 6px; text-align: center; vertical-align: middle; height: 50px;">
                    ${classes.map(classInfo => `
                      <div style="margin-bottom: 2px;">
                        <strong>${classInfo.group}</strong><br>
                        <span style="font-size: 9px;">${classInfo.subject}</span><br>
                        <span style="font-size: 8px;">Room: ${classInfo.room}</span>
                      </div>
                    `).join('')}
                  </td>
                `;
              }).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <div style="margin-top: 15px;">
        <h3 style="font-size: 14px; margin-bottom: 8px; font-weight: bold;">Groups Summary:</h3>
        ${groups.map((group, index) => `
          <div style="margin-bottom: 6px; font-size: 10px;">
            <strong>${index + 1}. ${group.name}</strong> - ${group.subjectName || 'Subject'} - Room ${group.classNumber} (${group.capacity} students)
            <div style="margin-left: 15px; font-size: 9px; margin-top: 2px;">
              ${group.schedules.filter(s => days.includes(s.day)).map(schedule => 
                `${schedule.day}: ${schedule.startTime} - ${schedule.endTime}`
              ).join(' | ')}
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
};

export const generateAttendanceSheetPDF = async (group: Group, students: Student[], subject?: string) => {
  try {
    // Create a temporary container for the attendance sheet
    const attendanceContainer = document.createElement('div');
    attendanceContainer.style.position = 'absolute';
    attendanceContainer.style.top = '-9999px';
    attendanceContainer.style.left = '-9999px';
    attendanceContainer.style.width = '600px';
    attendanceContainer.style.backgroundColor = 'white';
    attendanceContainer.style.padding = '20px';
    attendanceContainer.style.fontFamily = 'Arial, sans-serif';
    
    // Get enrolled students for this group
    const enrolledStudents = students.filter(student => 
      student.enrollments?.some(enrollment => enrollment.groupId === group.id)
    );
    
    // Generate the attendance sheet HTML
    const attendanceHTML = generateAttendanceHTML(group, enrolledStudents, subject);
    attendanceContainer.innerHTML = attendanceHTML;
    
    // Append to body temporarily
    document.body.appendChild(attendanceContainer);
    
    // Generate canvas from HTML
    const canvas = await html2canvas(attendanceContainer, {
      backgroundColor: 'white',
      scale: 2,
      useCORS: true,
      allowTaint: true,
    });
    
    // Remove temporary container
    document.body.removeChild(attendanceContainer);
    
    // Create PDF
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    // Calculate dimensions to fit A4
    const imgWidth = 190; // A4 width in mm with margins
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    // Handle multiple pages if content is too long
    const pageHeight = 277; // A4 height in mm with margins
    let yPosition = 10;
    
    if (imgHeight <= pageHeight) {
      // Single page
      pdf.addImage(imgData, 'PNG', 10, yPosition, imgWidth, imgHeight);
    } else {
      // Multiple pages
      const totalPages = Math.ceil(imgHeight / pageHeight);
      
      for (let page = 0; page < totalPages; page++) {
        if (page > 0) {
          pdf.addPage();
          yPosition = 10;
        }
        
        const sourceY = page * (canvas.height / totalPages);
        const sourceHeight = canvas.height / totalPages;
        
        // Create a canvas for this page
        const pageCanvas = document.createElement('canvas');
        pageCanvas.width = canvas.width;
        pageCanvas.height = sourceHeight;
        const pageCtx = pageCanvas.getContext('2d');
        
        if (pageCtx) {
          pageCtx.drawImage(
            canvas,
            0, sourceY, canvas.width, sourceHeight,
            0, 0, canvas.width, sourceHeight
          );
          
          const pageImgData = pageCanvas.toDataURL('image/png');
          const pageImgHeight = (sourceHeight * imgWidth) / canvas.width;
          
          pdf.addImage(pageImgData, 'PNG', 10, yPosition, imgWidth, pageImgHeight);
        }
      }
    }
    
    // Save the PDF
    const fileName = `${group.name.replace(/\s+/g, '_')}_Attendance_Sheet.pdf`;
    pdf.save(fileName);
    
  } catch (error) {
    console.error('Error generating attendance PDF:', error);
    throw new Error('Failed to generate attendance sheet');
  }
};

const generateAttendanceHTML = (group: Group, students: Student[], subject?: string): string => {
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return `
    <div style="font-family: Arial, sans-serif; padding: 20px; font-size: 12px; line-height: 1.4;">
      <!-- Header -->
      <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 15px;">
        <h1 style="margin: 0; font-size: 20px; font-weight: bold; color: #333;">
          ATTENDANCE SHEET
        </h1>
        <div style="margin: 10px 0; font-size: 14px;">
          <strong>Group:</strong> ${group.name} | <strong>Subject:</strong> ${subject || group.subjectName || 'N/A'}
        </div>
        <div style="margin: 5px 0; font-size: 12px; color: #666;">
          <strong>Date:</strong> ${currentDate} | <strong>Room:</strong> ${group.classNumber || 'N/A'}
        </div>
        <div style="margin: 5px 0; font-size: 11px; color: #666;">
          <strong>Teacher:</strong> ${group.teacherName || 'N/A'}
        </div>
      </div>

      <!-- Student List -->
      <div style="margin-bottom: 30px;">
        <table style="width: 100%; border-collapse: collapse; border: 2px solid #333;">
          <thead>
            <tr style="background-color: #f5f5f5;">
              <th style="border: 1px solid #333; padding: 10px; text-align: left; font-weight: bold; width: 40px;">
                #
              </th>
              <th style="border: 1px solid #333; padding: 10px; text-align: left; font-weight: bold;">
                Student Name
              </th>
              <th style="border: 1px solid #333; padding: 10px; text-align: center; font-weight: bold; width: 80px;">
                Status
              </th>
              <th style="border: 1px solid #333; padding: 10px; text-align: left; font-weight: bold; width: 150px;">
                Notes
              </th>
            </tr>
          </thead>
          <tbody>
            ${students.length === 0 ? `
              <tr>
                <td colspan="4" style="border: 1px solid #333; padding: 20px; text-align: center; color: #666; font-style: italic;">
                  No students enrolled in this group
                </td>
              </tr>
            ` : students.map((student, index) => `
              <tr ${index % 2 === 1 ? 'style="background-color: #f9f9f9;"' : ''}>
                <td style="border: 1px solid #333; padding: 12px; text-align: center; font-weight: bold;">
                  ${index + 1}
                </td>
                <td style="border: 1px solid #333; padding: 12px;">
                  ${student.firstName} ${student.lastName}
                </td>
                <td style="border: 1px solid #333; padding: 12px; text-align: center;">
                  <div style="width: 20px; height: 20px; border: 2px solid #333; display: inline-block; margin: 0 auto;"></div>
                </td>
                <td style="border: 1px solid #333; padding: 12px;">
                  <div style="height: 20px; border-bottom: 1px solid #ccc;"></div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <!-- Instructions -->
      <div style="border: 2px solid #333; padding: 15px; background-color: #f9f9f9;">
        <h3 style="margin: 0 0 10px 0; font-size: 14px; font-weight: bold; text-decoration: underline;">
          ATTENDANCE MARKING INSTRUCTIONS:
        </h3>
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <div style="flex: 1;">
            <strong>✓ PRESENT:</strong> Leave checkbox empty
          </div>
          <div style="flex: 1;">
            <strong>A - ABSENT:</strong> Write "A" in checkbox
          </div>
          <div style="flex: 1;">
            <strong>L - LATE:</strong> Write "L" in checkbox
          </div>
        </div>
        <div style="margin-top: 15px; font-size: 11px; color: #666; border-top: 1px solid #ccc; padding-top: 8px;">
          <strong>Notes:</strong> Use the "Notes" column for additional comments about individual students (e.g., reason for absence, time arrived if late, etc.)
        </div>
      </div>

      <!-- Footer -->
      <div style="margin-top: 30px; border-top: 1px solid #ccc; padding-top: 15px;">
        <div>
          <strong>Teacher Signature:</strong>
          <div style="margin-top: 20px; border-bottom: 1px solid #333; width: 250px;"></div>
        </div>
      </div>
    </div>
  `;
};
