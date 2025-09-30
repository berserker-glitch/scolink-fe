import React, { useState, useEffect, useRef } from 'react';
import { X, Download, Users, Calendar, Check, Clock, XCircle, FileText } from 'lucide-react';
import { apiService } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  enrollmentId: string;
}

interface AttendanceRecord {
  studentId: string;
  date: string;
  status: 'present' | 'absent' | 'late';
  note?: string;
}

interface AttendanceModalProps {
  groupId: string;
  groupName: string;
  subject: string;
  teacher: string;
  isOpen: boolean;
  onClose: () => void;
}

export const AttendanceModal: React.FC<AttendanceModalProps> = ({
  groupId,
  groupName,
  subject,
  teacher,
  isOpen,
  onClose
}) => {
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [groupScheduleDays, setGroupScheduleDays] = useState<string[]>([]);
  const printRef = useRef<HTMLDivElement>(null);

  // Generate class dates for the selected month based on group schedule
  const generateClassDates = (month: Date, scheduleDays: string[]) => {
    const dates: Date[] = [];
    const year = month.getFullYear();
    const monthNum = month.getMonth();
    const daysInMonth = new Date(year, monthNum + 1, 0).getDate();

    const dayMap: { [key: string]: number } = {
      'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3,
      'Thursday': 4, 'Friday': 5, 'Saturday': 6
    };

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, monthNum, day);
      const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
      
      if (scheduleDays.includes(dayName)) {
        dates.push(date);
      }
    }

    return dates;
  };

  const classDatesList = generateClassDates(selectedMonth, groupScheduleDays);
  
  // Determine if date is editable (current week and next week only)
  const isDateEditable = (date: Date) => {
    const now = new Date();
    const currentWeekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay() + 1); // Monday
    const nextWeekEnd = new Date(currentWeekStart.getTime() + (13 * 24 * 60 * 60 * 1000)); // Sunday next week
    
    return date >= currentWeekStart && date <= nextWeekEnd;
  };

  // Load group data and students
  useEffect(() => {
    if (isOpen && groupId) {
      loadGroupData();
    }
  }, [isOpen, groupId, selectedMonth]);

  const loadGroupData = async () => {
    setLoading(true);
    try {
      // Use the new optimized monthly attendance endpoint
      const monthlyData = await apiService.getGroupMonthlyAttendance(
        groupId,
        selectedMonth.getFullYear(),
        selectedMonth.getMonth() + 1
      );

      // Set schedule days from the response
      setGroupScheduleDays(monthlyData.classDays);

      // Set students from the response
      setStudents(monthlyData.students);

      // Transform attendance records
      const records = (monthlyData.attendanceRecords || []).map((record: any) => ({
        studentId: record.student?.id || '',
        date: record.date,
        status: record.status as 'present' | 'absent' | 'late',
        note: record.note
      }));

      setAttendanceRecords(records);
    } catch (error) {
      console.error('Error loading group data:', error);
      // Fallback to old method if the new API fails
      await loadGroupDataFallback();
    } finally {
      setLoading(false);
    }
  };

  const loadGroupDataFallback = async () => {
    try {
      // Get group details to extract schedule days
      const groupResponse = await apiService.getGroupById(groupId);
      const group = groupResponse;
      
      if (group.schedules && group.schedules.length > 0) {
        const days = group.schedules.map((schedule: any) => schedule.day);
        setGroupScheduleDays(days);
      }

      // Get students enrolled in this group
      const studentsResponse = await apiService.getStudents(1, 1000);
      const allStudents = studentsResponse.students || [];
      
      const enrolledStudents = allStudents
        .filter((student: any) => 
          student.enrollments?.some((enrollment: any) => enrollment.groupId === groupId)
        )
        .map((student: any) => {
          const enrollment = student.enrollments.find((e: any) => e.groupId === groupId);
          return {
            id: student.id,
            firstName: student.firstName,
            lastName: student.lastName,
            enrollmentId: enrollment?.id || ''
          };
        });

      setStudents(enrolledStudents);

      // Get attendance records for the month
      const startDate = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1);
      const endDate = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0);
      
      const attendanceResponse = await apiService.getAttendanceByGroup(
        groupId,
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0]
      );

      const records = (attendanceResponse || []).map((record: any) => ({
        studentId: record.student?.id || '',
        date: record.date,
        status: record.status as 'present' | 'absent' | 'late',
        note: record.note
      }));

      setAttendanceRecords(records);
    } catch (error) {
      console.error('Error loading group data with fallback:', error);
    }
  };

  const handleAttendanceChange = (studentId: string, date: string, status: 'present' | 'absent' | 'late') => {
    const existing = attendanceRecords.find(r => r.studentId === studentId && r.date === date);
    
    if (existing) {
      setAttendanceRecords(prev => 
        prev.map(record => 
          record.studentId === studentId && record.date === date
            ? { ...record, status }
            : record
        )
      );
    } else {
      setAttendanceRecords(prev => [...prev, { studentId, date, status }]);
    }
  };

  const saveAttendance = async () => {
    setSaving(true);
    try {
      // Group attendance records by date for bulk saving
      const recordsByDate: { [date: string]: any[] } = {};
      
      attendanceRecords.forEach(record => {
        const dateStr = record.date;
        if (!recordsByDate[dateStr]) {
          recordsByDate[dateStr] = [];
        }
        recordsByDate[dateStr].push({
          studentId: record.studentId,
          status: record.status,
          note: record.note
        });
      });

      // Save each date's attendance
      for (const [date, records] of Object.entries(recordsByDate)) {
        if (records.length > 0) {
          await apiService.bulkCreateAttendance({
            groupId,
            date,
            attendanceRecords: records
          });
        }
      }

      // Reload data to get updated records
      await loadGroupData();
    } catch (error) {
      console.error('Error saving attendance:', error);
    } finally {
      setSaving(false);
    }
  };

  const getAttendanceStatus = (studentId: string, date: string) => {
    return attendanceRecords.find(r => r.studentId === studentId && r.date === date)?.status;
  };

  const downloadPDF = async () => {
    if (!printRef.current) return;

    try {
      // Create a refined PDF with better layout
      const monthName = selectedMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      const pdf = new jsPDF('l', 'mm', 'a4'); // Landscape orientation
      
      // Generate refined PDF content
      await generateRefinedAttendancePDF(pdf, {
        groupName,
        subject,
        teacher,
        monthName,
        students,
        classDatesList,
        attendanceRecords
      });
      
      pdf.save(`${groupName}_Attendance_${monthName}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      // Fallback to canvas-based PDF
      await generateCanvasPDF();
    }
  };

  const generateRefinedAttendancePDF = async (pdf: jsPDF, data: any) => {
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 10;
    let yPosition = margin;

    // Header
    pdf.setFontSize(18);
    pdf.setFont("helvetica", "bold");
    pdf.text('MONTHLY ATTENDANCE SHEET', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 10;

    pdf.setFontSize(12);
    pdf.setFont("helvetica", "normal");
    pdf.text(`Group: ${data.groupName} | Subject: ${data.subject}`, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 6;
    
    pdf.text(`Teacher: ${data.teacher} | Month: ${data.monthName}`, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 15;

    // Calculate table dimensions
    const nameColWidth = 60;
    const dateColWidth = Math.min(20, (pageWidth - margin * 2 - nameColWidth) / data.classDatesList.length);
    const tableWidth = nameColWidth + (dateColWidth * data.classDatesList.length);
    const startX = (pageWidth - tableWidth) / 2;

    // Table header
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "bold");
    
    // Draw header borders and text
    pdf.rect(startX, yPosition, nameColWidth, 15);
    pdf.text('STUDENT NAME', startX + 2, yPosition + 10);
    
    data.classDatesList.forEach((date: string, index: number) => {
      const x = startX + nameColWidth + (index * dateColWidth);
      pdf.rect(x, yPosition, dateColWidth, 15);
      
      const dateObj = new Date(date);
      const dayText = dateObj.getDate().toString();
      const monthText = (dateObj.getMonth() + 1).toString();
      
      pdf.setFontSize(8);
      pdf.text(`${dayText}/${monthText}`, x + dateColWidth/2, yPosition + 6, { align: 'center' });
      
      const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
      pdf.text(dayName, x + dateColWidth/2, yPosition + 12, { align: 'center' });
    });
    
    yPosition += 15;

    // Table rows
    pdf.setFont("helvetica", "normal");
    data.students.forEach((student: Student, index: number) => {
      const rowHeight = 12;
      
      // Student name cell
      pdf.rect(startX, yPosition, nameColWidth, rowHeight);
      pdf.setFontSize(9);
      pdf.text(`${index + 1}. ${student.firstName} ${student.lastName}`, startX + 2, yPosition + 8);
      
      // Attendance cells
      data.classDatesList.forEach((date: string, dateIndex: number) => {
        const x = startX + nameColWidth + (dateIndex * dateColWidth);
        pdf.rect(x, yPosition, dateColWidth, rowHeight);
        
        // Find attendance record for this student and date
        const record = data.attendanceRecords.find((r: AttendanceRecord) => 
          r.studentId === student.id && r.date === date
        );
        
        if (record) {
          let statusText = '';
          switch (record.status) {
            case 'present': statusText = 'P'; break;
            case 'absent': statusText = 'A'; break;
            case 'late': statusText = 'L'; break;
          }
          
          pdf.setFontSize(10);
          pdf.setFont("helvetica", "bold");
          pdf.text(statusText, x + dateColWidth/2, yPosition + 8, { align: 'center' });
          pdf.setFont("helvetica", "normal");
        }
      });
      
      yPosition += rowHeight;
      
      // Check if we need a new page
      if (yPosition > pageHeight - 30) {
        pdf.addPage();
        yPosition = margin;
      }
    });

    // Legend
    yPosition += 10;
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "bold");
    pdf.text('Legend:', margin, yPosition);
    yPosition += 6;
    
    pdf.setFont("helvetica", "normal");
    pdf.text('P = Present    A = Absent    L = Late', margin, yPosition);
  };

  const generateCanvasPDF = async () => {
    if (!printRef.current) return;

    const canvas = await html2canvas(printRef.current, {
      backgroundColor: 'white',
      scale: 1.5,
      useCORS: true,
      allowTaint: true,
      width: printRef.current.scrollWidth,
      height: printRef.current.scrollHeight,
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('l', 'mm', 'a4');
    
    const imgWidth = 277;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    // Handle multiple pages if content is too long
    const pageHeight = 190;
    let position = 0;
    
    while (position < imgHeight) {
      const pageCanvas = document.createElement('canvas');
      const pageCtx = pageCanvas.getContext('2d');
      
      pageCanvas.width = canvas.width;
      pageCanvas.height = Math.min(canvas.height - position * (canvas.height / imgHeight), canvas.height * pageHeight / imgHeight);
      
      if (pageCtx) {
        pageCtx.drawImage(
          canvas,
          0, position * (canvas.height / imgHeight),
          canvas.width, pageCanvas.height,
          0, 0,
          canvas.width, pageCanvas.height
        );
        
        const pageImgData = pageCanvas.toDataURL('image/png');
        
        if (position > 0) {
          pdf.addPage();
        }
        
        pdf.addImage(pageImgData, 'PNG', 10, 10, imgWidth, Math.min(pageHeight, imgHeight - position));
      }
      
      position += pageHeight;
    }
    
    const monthName = selectedMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    pdf.save(`${groupName}_Attendance_${monthName}.pdf`);
  };

  const monthName = selectedMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'present': return <Check className="w-4 h-4 text-purple-600" />;
      case 'absent': return <XCircle className="w-4 h-4 text-red-600" />;
      case 'late': return <Clock className="w-4 h-4 text-yellow-600" />;
      default: return <div className="w-4 h-4 border border-gray-300 rounded"></div>;
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 sm:p-2 p-0"
      onClick={onClose}
    >
      <div 
        className="bg-white sm:rounded-xl rounded-none w-full sm:w-[98vw] h-full sm:h-[96vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Header - Compact */}
        <div className="sm:hidden flex items-center justify-between p-4 border-b bg-purple-600 text-white flex-shrink-0">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold truncate">Take Attendance</h2>
            <p className="text-xs opacity-90 truncate">{groupName} - {subject}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-purple-700 rounded-lg transition-colors ml-3 flex-shrink-0"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Mobile Controls */}
        <div className="sm:hidden flex items-center gap-2 p-3 border-b bg-gray-50">
          <div className="flex items-center gap-2 flex-1">
            <Calendar className="w-4 h-4 text-gray-500 flex-shrink-0" />
            <select
              value={`${selectedMonth.getFullYear()}-${selectedMonth.getMonth() + 1}`}
              onChange={(e) => {
                const [year, month] = e.target.value.split('-');
                setSelectedMonth(new Date(parseInt(year), parseInt(month) - 1, 1));
              }}
              className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 flex-1"
            >
              {Array.from({ length: 6 }, (_, i) => {
                const date = new Date();
                date.setMonth(date.getMonth() - 2 + i);
                const value = `${date.getFullYear()}-${date.getMonth() + 1}`;
                const label = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
                return (
                  <option key={value} value={value}>{label}</option>
                );
              })}
            </select>
          </div>
          
          <button
            onClick={downloadPDF}
            className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex-shrink-0"
          >
            <Download className="w-4 h-4" />
            <span className="text-sm font-medium">PDF</span>
          </button>
        </div>

        {/* Desktop Header - Full */}
        <div className="hidden sm:flex items-center justify-between p-6 border-b flex-shrink-0">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-purple-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">Take Attendance</h2>
              <p className="text-sm text-gray-600">{groupName} - {subject}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <select
                value={`${selectedMonth.getFullYear()}-${selectedMonth.getMonth() + 1}`}
                onChange={(e) => {
                  const [year, month] = e.target.value.split('-');
                  setSelectedMonth(new Date(parseInt(year), parseInt(month) - 1, 1));
                }}
                className="border border-gray-300 rounded-lg px-3 py-1 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                {Array.from({ length: 6 }, (_, i) => {
                  const date = new Date();
                  date.setMonth(date.getMonth() - 2 + i);
                  const value = `${date.getFullYear()}-${date.getMonth() + 1}`;
                  const label = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                  return (
                    <option key={value} value={value}>{label}</option>
                  );
                })}
              </select>
            </div>
            
            <button
              onClick={downloadPDF}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Download PDF
            </button>
            
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 sm:p-6 p-3 overflow-auto min-h-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
          ) : (
            <div ref={printRef} className="bg-white">
              {/* Print Header */}
              <div className="text-center mb-6 print-only">
                <h1 className="text-2xl font-bold mb-2">Monthly Attendance Sheet</h1>
                <div className="text-lg font-medium mb-1">{groupName} - {subject}</div>
                <div className="text-gray-600">Teacher: {teacher} | Month: {monthName}</div>
              </div>

              {/* Attendance Table */}
              <div className="overflow-x-auto overflow-y-visible">
                <table className="w-full border-collapse border border-gray-300 text-sm min-w-max">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-300 p-3 text-left font-medium w-16">
                        NO.
                      </th>
                      <th className="border border-gray-300 p-3 text-left font-medium min-w-[250px] w-64">
                        STUDENT NAME
                      </th>
                      {classDatesList.map(date => (
                        <th key={date.toISOString()} className="border border-gray-300 p-2 text-center font-medium w-20 min-w-[60px]">
                          <div className="text-xs text-gray-600">
                            {date.toLocaleDateString('en-US', { weekday: 'short' })}
                          </div>
                          <div className="font-bold">
                            {date.getDate()}/{date.getMonth() + 1}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student, index) => (
                      <tr key={student.id} className={index % 2 === 1 ? 'bg-gray-25' : ''}>
                        <td className="border border-gray-300 p-3 text-center font-medium align-middle">
                          {index + 1}
                        </td>
                        <td className="border border-gray-300 p-3 font-medium align-middle">
                          <div className="truncate">{student.firstName} {student.lastName}</div>
                        </td>
                        {classDatesList.map(date => {
                          const dateStr = date.toISOString().split('T')[0];
                          const status = getAttendanceStatus(student.id, dateStr);
                          const editable = isDateEditable(date);
                          
                          return (
                            <td key={dateStr} className="border border-gray-300 p-2 text-center align-middle">
                              {editable ? (
                                <div className="flex items-center justify-center">
                                  <select
                                    value={status || ''}
                                    onChange={(e) => handleAttendanceChange(
                                      student.id, 
                                      dateStr, 
                                      e.target.value as 'present' | 'absent' | 'late'
                                    )}
                                    className="border border-gray-200 rounded px-2 py-1 text-sm min-w-[50px] focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white"
                                  >
                                    <option value="">-</option>
                                    <option value="present">P</option>
                                    <option value="absent">A</option>
                                    <option value="late">L</option>
                                  </select>
                                </div>
                              ) : (
                                <div className="flex items-center justify-center">
                                  {status ? (
                                    <span className={`px-2 py-1 rounded text-sm font-medium ${
                                      status === 'present' ? 'bg-purple-100 text-purple-800' :
                                      status === 'absent' ? 'bg-red-100 text-red-800' :
                                      'bg-amber-100 text-amber-800'
                                    }`}>
                                      {status === 'present' ? 'P' : status === 'absent' ? 'A' : 'L'}
                                    </span>
                                  ) : (
                                    <span className="text-gray-400">-</span>
                                  )}
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Legend */}
              <div className="mt-6 flex items-center gap-6 text-sm print-only">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-purple-100 rounded border"></div>
                  <span>P = Present</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-100 rounded border"></div>
                  <span>A = Absent</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-yellow-100 rounded border"></div>
                  <span>L = Late</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer - Mobile */}
        <div className="sm:hidden border-t bg-white flex-shrink-0 p-3 space-y-3">
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={saveAttendance}
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-50 transition-colors font-medium"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  <span>Save</span>
                </>
              )}
            </button>
          </div>
          <p className="text-xs text-gray-500 text-center">
            📝 You can edit attendance for current and next week only
          </p>
        </div>

        {/* Footer - Desktop */}
        <div className="hidden sm:flex items-center justify-between p-6 border-t bg-gray-50 flex-shrink-0">
          <div className="text-sm text-gray-600 max-w-2xl">
            <span className="font-medium">📝 Note:</span> You can only edit attendance for the current week and next week.
            Past records are shown as read-only. Use the month selector to view different months.
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={saveAttendance}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
            >
              {saving ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Check className="w-4 h-4" />
              )}
              {saving ? 'Saving...' : 'Save Attendance'}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          .print-only { display: block !important; }
          .no-print { display: none !important; }
        }
        .print-only { display: none; }
      `}</style>
    </div>
  );
};
