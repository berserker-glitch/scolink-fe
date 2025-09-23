//const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api/v1';
const API_BASE_URL ='https://api.scolink.ink/api/v1';
//const API_BASE_URL = 'http://localhost:3001/api/v1';
// Debug: Log the API base URL being used
//console.log('🌐 Frontend is using API_BASE_URL:', API_BASE_URL);
console.log('🌐 Environment mode:', import.meta.env.MODE);
console.log('🌐 All env vars starting with VITE_:', Object.keys(import.meta.env).filter(k => k.startsWith('VITE_')));

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  user: {
    id: string;
    email: string;
    fullName: string;
    role: string;
    isActive: boolean;
  };
  accessToken: string;
  refreshToken: string;
}

interface User {
  id: string;
  email: string;
  fullName: string;
  role: string;
  isActive: boolean;
  phoneNumber?: string;
  createdAt: string;
  updatedAt: string;
  centerId?: string;
}

interface Center {
  id: string;
  name: string;
  location: string;
  phoneNumber?: string;
  email?: string;
  plan: 'basic' | 'pro' | 'premium' | 'lifetime';
  planExpiresAt?: string;
  planUpgradedAt?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CreateCenterRequest {
  name: string;
  location: string;
  phoneNumber?: string;
  email?: string;
}

interface CreateCenterAdminRequest {
  email: string;
  password: string;
  fullName: string;
  phoneNumber?: string;
}

interface SignupRequest {
  center: {
    name: string;
    location: string;
    phoneNumber: string;
    email: string;
  };
  admin: {
    email: string;
    password: string;
    fullName: string;
    phoneNumber: string;
  };
}

interface Year {
  id: string;
  name: string;
  order: number;
  isActive: boolean;
  centerId: string;
  createdAt: string;
  updatedAt: string;
  fieldsCount?: number;
}

interface Field {
  id: string;
  name: string;
  yearId: string;
  centerId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  yearName?: string;
}

interface CreateYearRequest {
  name: string;
  order: number;
  isActive?: boolean;
}

interface UpdateYearRequest {
  name?: string;
  order?: number;
  isActive?: boolean;
}

interface CreateFieldRequest {
  name: string;
  yearId: string;
  isActive?: boolean;
}

interface UpdateFieldRequest {
  name?: string;
  yearId?: string;
  isActive?: boolean;
}

interface Subject {
  id: string;
  name: string;
  monthlyFee: number;
  yearId: string;
  fieldId: string;
  centerId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  yearName?: string;
  fieldName?: string;
  groupsCount?: number;
}

interface CreateSubjectRequest {
  name: string;
  monthlyFee: number;
  yearId: string;
  fieldId: string;
  isActive?: boolean;
}

interface UpdateSubjectRequest {
  name?: string;
  monthlyFee?: number;
  yearId?: string;
  fieldId?: string;
  isActive?: boolean;
}

interface Teacher {
  id: string;
  name: string;
  email: string;
  phone?: string;
  bio?: string;
  centerId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  groupsCount?: number;
  subjects?: string[];
}

interface Group {
  id: string;
  name: string;
  capacity: number;
  classNumber: string;
  subjectId: string;
  teacherId?: string;
  centerId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  subjectName?: string;
  teacherName?: string;
  studentCount?: number;
  schedules: {
    id: string;
    day: string;
    startTime: string;
    endTime: string;
  }[];
}


interface UpdateSubjectRequest {
  name?: string;
  monthlyFee?: number;
  yearId?: string;
  fieldId?: string;
  isActive?: boolean;
}

interface CreateTeacherRequest {
  name: string;
  email: string;
  phone?: string;
  bio?: string;
  isActive?: boolean;
}

interface UpdateTeacherRequest {
  name?: string;
  email?: string;
  phone?: string;
  bio?: string;
  isActive?: boolean;
}

interface GroupSchedule {
  day: string;
  startTime: string;
  endTime: string;
}

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  sex: 'M' | 'F';
  yearId: string;
  fieldId: string;
  phone: string;
  parentPhone: string;
  parentType: 'Mother' | 'Father' | 'Guardian';
  tag: 'normal' | 'ss';
  cni?: string;
  centerId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  yearName?: string;
  fieldName?: string;
  enrollments?: Array<{
    id: string;
    groupId: string;
    groupName?: string;
    subjectId?: string;
    subjectName?: string;
  }>;
  payments?: Array<{
    id: string;
    month: string;
    subjectIds: string[];
    amount: number;
    date: string;
    status: 'paid' | 'pending' | 'overdue';
  }>;
  subjects?: Array<{
    subjectId: string;
    groupId: string;
  }>;
  notes?: string;
}

interface CreateGroupRequest {
  name: string;
  capacity: number;
  classNumber: string;
  subjectId: string;
  teacherId?: string;
  schedules: GroupSchedule[];
  isActive?: boolean;
}

interface CreateStudentRequest {
  firstName: string;
  lastName: string;
  sex: 'M' | 'F';
  yearId: string;
  fieldId: string;
  phone: string;
  parentPhone: string;
  parentType: 'Mother' | 'Father' | 'Guardian';
  tag?: 'normal' | 'ss';
  cni?: string;
  isActive?: boolean;
}

interface UpdateStudentRequest {
  firstName?: string;
  lastName?: string;
  sex?: 'M' | 'F';
  yearId?: string;
  fieldId?: string;
  phone?: string;
  parentPhone?: string;
  parentType?: 'Mother' | 'Father' | 'Guardian';
  tag?: 'normal' | 'ss';
  cni?: string;
  isActive?: boolean;
}

interface StudentsResponse {
  students: Student[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface UpdateGroupRequest {
  name?: string;
  capacity?: number;
  classNumber?: string;
  subjectId?: string;
  teacherId?: string;
  schedules?: GroupSchedule[];
  isActive?: boolean;
}

interface Event {
  id: string;
  name: string;
  type: 'Normal' | 'TempAdditionalCourseDay';
  fee?: number;
  description?: string;
  centerId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  schedules: EventSchedule[];
  enrollments?: EventEnrollment[];
  groups?: EventGroup[];
  enrolledStudentsCount?: number;
}

interface EventSchedule {
  id: string;
  eventId: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
}

interface EventEnrollment {
  id: string;
  eventId: string;
  studentId: string;
  student?: {
    id: string;
    firstName: string;
    lastName: string;
    yearName?: string;
    fieldName?: string;
  };
}

interface EventGroup {
  id: string;
  eventId: string;
  groupId: string;
  group?: {
    id: string;
    name: string;
    subjectName?: string;
    teacherName?: string;
  };
}

interface CreateEventRequest {
  name: string;
  type: 'Normal' | 'TempAdditionalCourseDay';
  fee?: number;
  description?: string;
  schedules: Array<{
    date: string; // YYYY-MM-DD
    startTime: string; // HH:MM
    endTime: string; // HH:MM
  }>;
  groupIds?: string[]; // For temp additional course days
}

interface UpdateEventRequest {
  name?: string;
  type?: 'Normal' | 'TempAdditionalCourseDay';
  fee?: number;
  description?: string;
  schedules?: Array<{
    date: string;
    startTime: string;
    endTime: string;
  }>;
  groupIds?: string[];
  isActive?: boolean;
}

// Payment interfaces
interface Payment {
  id: string;
  studentId: string;
  month: string;
  amount: number;
  paidAmount?: number;
  status: 'paid' | 'partial' | 'pending' | 'overdue';
  paymentDate?: string;
  dueDate: string;
  method?: 'cash' | 'transfer' | 'check' | 'other';
  note?: string;
  subjects: {
    subjectId: string;
    amount: number;
  }[];
  recordedBy: string;
  centerId: string;
  createdAt: string;
  updatedAt: string;
}

interface CreatePaymentRequest {
  studentId: string;
  month: string;
  subjects: {
    subjectId: string;
    amount: number;
  }[];
  amount: number;
  paidAmount?: number;
  paymentDate?: string;
  method?: 'cash' | 'transfer' | 'check' | 'other';
  note?: string;
}

interface UpdatePaymentRequest {
  amount?: number;
  paidAmount?: number;
  status?: 'paid' | 'partial' | 'pending' | 'overdue';
  paymentDate?: string;
  method?: 'cash' | 'transfer' | 'check' | 'other';
  note?: string;
}

interface RecordPaymentRequest {
  studentId: string;
  month: string;
  subjectIds: string[];
  paidAmount?: number;
  paymentDate?: string;
  method?: 'cash' | 'transfer' | 'check' | 'other';
  note?: string;
}

interface MarkPaidRequest {
  paidAmount?: number;
  paymentDate?: string;
  method?: 'cash' | 'transfer' | 'check' | 'other';
  note?: string;
}

interface PaymentFilters {
  page?: number;
  limit?: number;
  studentId?: string;
  month?: string;
  status?: 'paid' | 'partial' | 'pending' | 'overdue';
  search?: string;
}

interface PaymentSummary {
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  overdueAmount: number;
  paymentCount: number;
  paidCount: number;
  pendingCount: number;
  overdueCount: number;
}

interface MonthlyPaymentStatus {
  month: string;
  studentId: string;
  totalAmount: number;
  paidAmount: number;
  status: 'paid' | 'partial' | 'pending' | 'overdue';
  dueDate: string;
  subjects: {
    subjectId: string;
    subjectName: string;
    amount: number;
    paid: boolean;
  }[];
}

class ApiService {
  getBaseUrl(): string {
    return API_BASE_URL;
  }

  private getAuthToken(): string | null {
    return localStorage.getItem('access_token');
  }

  private getRefreshToken(): string | null {
    return localStorage.getItem('refresh_token');
  }

  private async refreshAccessToken(): Promise<string | null> {
    try {
      const refreshToken = this.getRefreshToken();
      console.log('Attempting to refresh with token:', refreshToken ? 'Present' : 'Missing');
      
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      console.log('Making refresh request to:', `${API_BASE_URL}/auth/refresh`);
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      console.log('Refresh response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Refresh failed with error:', errorData);
        throw new Error('Token refresh failed');
      }

      const data = await response.json();
      console.log('Refresh response data:', data);
      
      if (data.success && data.data) {
        // Update stored tokens
        localStorage.setItem('access_token', data.data.accessToken);
        localStorage.setItem('refresh_token', data.data.refreshToken);
        console.log('Tokens updated successfully, new access token:', data.data.accessToken.substring(0, 20) + '...');
        return data.data.accessToken;
      }

      throw new Error('Invalid refresh response');
    } catch (error) {
      console.error('Token refresh failed:', error);
      // Clear tokens and redirect to login
      this.clearTokens();
      return null;
    }
  }

  private clearTokens(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('scolink_user');
    // Note: Don't redirect here - let AuthContext handle session management
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retryWithRefresh = true
  ): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, options, retryWithRefresh);
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {},
    retryWithRefresh = true
  ): Promise<ApiResponse<T>> {
    // Always get a fresh token for each request attempt
    const token = this.getAuthToken();
    console.log(`Using access token for ${endpoint}:`, token ? `${token.substring(0, 20)}...` : 'None');
    
    // Create headers without Authorization first, then add it
    const baseHeaders = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Remove any existing Authorization header to prevent conflicts
    if ('Authorization' in baseHeaders) {
      delete (baseHeaders as any).Authorization;
    }

    const config: RequestInit = {
      ...options,
      headers: {
        ...baseHeaders,
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    };

    try {
      console.log(`Making API request to: ${API_BASE_URL}${endpoint}`);
      console.log('Request config:', config);
      console.log('🔍 REQUEST METHOD:', config.method || 'GET (default)');
      console.log('🔍 REQUEST BODY:', config.body || 'No body');
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
      
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      const data = await response.json();
      console.log('API response data:', data);

      if (!response.ok) {
        console.error('API error response:', data);
        
        // If 401 error and we haven't retried yet, try to refresh token
        if (response.status === 401 && retryWithRefresh) {
          console.log('Access token expired, attempting to refresh...');
          const newToken = await this.refreshAccessToken();
          
          if (newToken) {
            console.log('Token refresh successful, retrying original request with fresh token...');
            // Retry the request - makeRequest will get the fresh token
            return this.makeRequest(endpoint, options, false); // Don't retry again
          } else {
            console.log('Token refresh failed, cannot retry request');
          }
        }
        
        throw new Error(data.message || 'Request failed');
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Authentication
  async signup(signupData: SignupRequest): Promise<{ center: Center; admin: User }> {
    const response = await this.request<{ center: Center; admin: User }>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(signupData),
    });

    return response.data!;
  }

  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await this.request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    const loginData = response.data!;
    console.log('Login successful, storing tokens...');
    console.log('Access Token:', loginData.accessToken ? `${loginData.accessToken.substring(0, 20)}...` : 'Missing');
    console.log('Refresh Token:', loginData.refreshToken ? `${loginData.refreshToken.substring(0, 20)}...` : 'Missing');
    
    // Store tokens and user data in localStorage
    localStorage.setItem('access_token', loginData.accessToken);
    localStorage.setItem('refresh_token', loginData.refreshToken);
    localStorage.setItem('scolink_user', JSON.stringify(loginData.user));

    return loginData;
  }

  async getProfile(): Promise<User> {
    const response = await this.request<User>('/auth/profile');
    return response.data!;
  }

  async logout(): Promise<void> {
    const refreshToken = this.getRefreshToken();
    
    try {
      await this.request('/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
      });
    } catch (error) {
      console.error('Logout API call failed:', error);
      // Continue with local cleanup even if API call fails
    }

    this.clearTokens();
  }

  // Users
  async getUsers(page = 1, limit = 10, search = ''): Promise<{
    users: User[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(search && { search }),
    });

    const response = await this.request<User[]>(`/users?${params}`);
    
    return {
      users: response.data || [],
      pagination: response.pagination || { page: 1, limit: 10, total: 0, totalPages: 0 }
    };
  }

  async getUserById(id: string): Promise<User> {
    const response = await this.request<User>(`/users/${id}`);
    return response.data!;
  }

  async updateUser(id: string, userData: Partial<User>): Promise<User> {
    const response = await this.request<User>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
    return response.data!;
  }

  async deleteUser(id: string): Promise<void> {
    await this.request(`/users/${id}`, {
      method: 'DELETE',
    });
  }

  async suspendUser(id: string): Promise<User> {
    const response = await this.request<User>(`/users/${id}/suspend`, {
      method: 'PUT',
    });
    return response.data!;
  }

  async unsuspendUser(id: string): Promise<User> {
    const response = await this.request<User>(`/users/${id}/unsuspend`, {
      method: 'PUT',
    });
    return response.data!;
  }

  // Centers
  async getCenters(page = 1, limit = 10, search = ''): Promise<{
    centers: Center[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(search && { search }),
    });

    const response = await this.request<Center[]>(`/centers?${params}`);
    
    return {
      centers: response.data || [],
      pagination: response.pagination || { page: 1, limit: 10, total: 0, totalPages: 0 }
    };
  }

  async createCenter(centerData: CreateCenterRequest): Promise<Center> {
    const response = await this.request<Center>('/centers', {
      method: 'POST',
      body: JSON.stringify(centerData),
    });
    return response.data!;
  }

  async getCenterById(id: string): Promise<Center> {
    const response = await this.request<Center>(`/centers/${id}`);
    return response.data!;
  }

  async updateCenter(id: string, centerData: Partial<CreateCenterRequest>): Promise<Center> {
    const response = await this.request<Center>(`/centers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(centerData),
    });
    return response.data!;
  }

  async deleteCenter(id: string): Promise<void> {
    await this.request(`/centers/${id}`, {
      method: 'DELETE',
    });
  }

  async suspendCenter(id: string): Promise<Center> {
    const response = await this.request<Center>(`/centers/${id}/suspend`, {
      method: 'PUT',
    });
    return response.data!;
  }

  async unsuspendCenter(id: string): Promise<Center> {
    const response = await this.request<Center>(`/centers/${id}/unsuspend`, {
      method: 'PUT',
    });
    return response.data!;
  }

  // Center Admins
  async createCenterAdmin(centerId: string, adminData: CreateCenterAdminRequest): Promise<User> {
    const response = await this.request<User>(`/centers/${centerId}/admins`, {
      method: 'POST',
      body: JSON.stringify(adminData),
    });
    return response.data!;
  }

  async getCenterAdmins(centerId: string): Promise<User[]> {
    const response = await this.request<User[]>(`/centers/${centerId}/admins`);
    return response.data || [];
  }

  async getCenterAdminById(centerId: string, adminId: string): Promise<User> {
    const response = await this.request<User>(`/centers/${centerId}/admins/${adminId}`);
    return response.data!;
  }

  async updateCenterAdmin(centerId: string, adminId: string, adminData: Partial<CreateCenterAdminRequest>): Promise<User> {
    const response = await this.request<User>(`/centers/${centerId}/admins/${adminId}`, {
      method: 'PUT',
      body: JSON.stringify(adminData),
    });
    return response.data!;
  }

  async deleteCenterAdmin(centerId: string, adminId: string): Promise<void> {
    await this.request(`/centers/${centerId}/admins/${adminId}`, {
      method: 'DELETE',
    });
  }

  // Years
  async getYears(page = 1, limit = 50): Promise<{
    years: Year[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    const response = await this.request<Year[]>(`/years?${params}`);
    
    return {
      years: response.data || [],
      pagination: response.pagination || { page: 1, limit: 10, total: 0, totalPages: 0 }
    };
  }

  async createYear(yearData: CreateYearRequest): Promise<Year> {
    const response = await this.request<Year>('/years', {
      method: 'POST',
      body: JSON.stringify(yearData),
    });
    return response.data!;
  }

  async getYearById(id: string): Promise<Year> {
    const response = await this.request<Year>(`/years/${id}`);
    return response.data!;
  }

  async getYearWithFields(id: string): Promise<Year & { fields: Field[] }> {
    const response = await this.request<Year & { fields: Field[] }>(`/years/${id}/fields`);
    return response.data!;
  }

  async updateYear(id: string, yearData: UpdateYearRequest): Promise<Year> {
    const response = await this.request<Year>(`/years/${id}`, {
      method: 'PUT',
      body: JSON.stringify(yearData),
    });
    return response.data!;
  }

  async deleteYear(id: string, cascade = false): Promise<void> {
    const params = cascade ? '?cascade=true' : '';
    await this.request(`/years/${id}${params}`, {
      method: 'DELETE',
    });
  }

  // Fields
  async getFields(page = 1, limit = 50): Promise<{
    fields: Field[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    const response = await this.request<Field[]>(`/fields?${params}`);
    
    return {
      fields: response.data || [],
      pagination: response.pagination || { page: 1, limit: 10, total: 0, totalPages: 0 }
    };
  }

  async createField(fieldData: CreateFieldRequest): Promise<Field> {
    const response = await this.request<Field>('/fields', {
      method: 'POST',
      body: JSON.stringify(fieldData),
    });
    return response.data!;
  }

  async getFieldById(id: string): Promise<Field> {
    const response = await this.request<Field>(`/fields/${id}`);
    return response.data!;
  }

  async getFieldsByYear(yearId: string): Promise<Field[]> {
    const response = await this.request<Field[]>(`/fields/year/${yearId}`);
    return response.data || [];
  }

  async updateField(id: string, fieldData: UpdateFieldRequest): Promise<Field> {
    const response = await this.request<Field>(`/fields/${id}`, {
      method: 'PUT',
      body: JSON.stringify(fieldData),
    });
    return response.data!;
  }

  async deleteField(id: string): Promise<void> {
    await this.request(`/fields/${id}`, {
      method: 'DELETE',
    });
  }

  // Subjects
  async getSubjects(page = 1, limit = 50): Promise<{
    subjects: Subject[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    const response = await this.request<Subject[]>(`/subjects?${params}`);
    
    return {
      subjects: response.data || [],
      pagination: response.pagination || { page: 1, limit: 10, total: 0, totalPages: 0 }
    };
  }

  async createSubject(subjectData: CreateSubjectRequest): Promise<Subject> {
    const response = await this.request<Subject>('/subjects', {
      method: 'POST',
      body: JSON.stringify(subjectData),
    });
    return response.data!;
  }

  async getSubjectById(id: string): Promise<Subject> {
    const response = await this.request<Subject>(`/subjects/${id}`);
    return response.data!;
  }

  async getSubjectWithGroups(id: string): Promise<Subject & { groups: Group[] }> {
    const response = await this.request<Subject & { groups: Group[] }>(`/subjects/${id}/groups`);
    return response.data!;
  }

  async getSubjectsByField(fieldId: string): Promise<Subject[]> {
    const response = await this.request<Subject[]>(`/subjects/field/${fieldId}`);
    return response.data || [];
  }

  async updateSubject(id: string, subjectData: UpdateSubjectRequest): Promise<Subject> {
    const response = await this.request<Subject>(`/subjects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(subjectData),
    });
    return response.data!;
  }

  async deleteSubject(id: string, cascade = false): Promise<void> {
    const params = cascade ? '?cascade=true' : '';
    await this.request(`/subjects/${id}${params}`, {
      method: 'DELETE',
    });
  }

  // Teachers
  async getTeachers(page = 1, limit = 50): Promise<{
    teachers: Teacher[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    const response = await this.request<Teacher[]>(`/teachers?${params}`);
    
    return {
      teachers: response.data || [],
      pagination: response.pagination || { page: 1, limit: 10, total: 0, totalPages: 0 }
    };
  }

  async createTeacher(teacherData: CreateTeacherRequest): Promise<Teacher> {
    const response = await this.request<Teacher>('/teachers', {
      method: 'POST',
      body: JSON.stringify(teacherData),
    });
    return response.data!;
  }

  async getTeacherById(id: string): Promise<Teacher> {
    const response = await this.request<Teacher>(`/teachers/${id}`);
    return response.data!;
  }

  async getTeacherWithGroups(id: string): Promise<Teacher & { groups: Group[] }> {
    const response = await this.request<Teacher & { groups: Group[] }>(`/teachers/${id}/groups`);
    return response.data!;
  }

  async updateTeacher(id: string, teacherData: UpdateTeacherRequest): Promise<Teacher> {
    const response = await this.request<Teacher>(`/teachers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(teacherData),
    });
    return response.data!;
  }

  async deleteTeacher(id: string): Promise<void> {
    await this.request(`/teachers/${id}`, {
      method: 'DELETE',
    });
  }

  // Groups
  async getGroups(page = 1, limit = 50): Promise<{
    groups: Group[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
  }> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    const response = await this.request<Group[]>(`/groups?${params}`);
    
    return {
      groups: response.data || [],
      pagination: response.pagination || { page: 1, limit: 10, total: 0, totalPages: 0 }
    };
  }

  async createGroup(groupData: CreateGroupRequest): Promise<Group> {
    const response = await this.request<Group>('/groups', {
      method: 'POST',
      body: JSON.stringify(groupData),
    });
    return response.data!;
  }

  async getGroupById(id: string): Promise<Group> {
    const response = await this.request<Group>(`/groups/${id}`);
    return response.data!;
  }

  async getGroupWithDetails(id: string): Promise<Group> {
    const response = await this.request<Group>(`/groups/${id}/details`);
    return response.data!;
  }

  async getGroupStudents(groupId: string): Promise<Student[]> {
    const response = await this.request<Student[]>(`/groups/${groupId}/students`);
    return response.data || [];
  }

  async getGroupsBySubject(subjectId: string): Promise<Group[]> {
    const response = await this.request<Group[]>(`/groups/subject/${subjectId}`);
    return response.data || [];
  }

  async updateGroup(id: string, groupData: UpdateGroupRequest): Promise<Group> {
    const response = await this.request<Group>(`/groups/${id}`, {
      method: 'PUT',
      body: JSON.stringify(groupData),
    });
    return response.data!;
  }

  async deleteGroup(id: string): Promise<void> {
    await this.request(`/groups/${id}`, {
      method: 'DELETE',
    });
  }

  // Student methods
  async getStudents(page: number = 1, limit: number = 20, search?: string, yearId?: string, fieldId?: string, isActive?: boolean): Promise<StudentsResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(search && { search }),
      ...(yearId && { yearId }),
      ...(fieldId && { fieldId }),
      ...(isActive !== undefined && { isActive: isActive.toString() }),
    });

    const response = await this.request<StudentsResponse>(`/students?${params}`);
    return response.data!;
  }

  async getStudentById(id: string): Promise<Student> {
    const response = await this.request<Student>(`/students/${id}`);
    return response.data!;
  }

  async createStudent(studentData: CreateStudentRequest): Promise<Student> {
    const response = await this.request<Student>('/students', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(studentData),
    });
    return response.data!;
  }

  async updateStudent(id: string, studentData: UpdateStudentRequest): Promise<Student> {
    const response = await this.request<Student>(`/students/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(studentData),
    });
    return response.data!;
  }

  async deleteStudent(id: string): Promise<void> {
    await this.request(`/students/${id}`, {
      method: 'DELETE',
    });
  }

  // Student Enrollment methods
  async enrollStudentInSubjects(studentId: string, enrollments: { subjectId: string; groupId: string }[]): Promise<void> {
    await this.request(`/students/${studentId}/enrollments`, {
      method: 'POST',
      body: JSON.stringify({ enrollments }),
    });
  }

  async updateStudentEnrollment(studentId: string, enrollmentId: string, groupId: string): Promise<void> {
    await this.request(`/students/${studentId}/enrollments/${enrollmentId}`, {
      method: 'PUT',
      body: JSON.stringify({ groupId }),
    });
  }

  async removeStudentEnrollment(studentId: string, enrollmentId: string): Promise<void> {
    await this.request(`/students/${studentId}/enrollments/${enrollmentId}`, {
      method: 'DELETE',
    });
  }

  // Attendance API Methods
  async createAttendanceRecord(data: { enrollmentId: string; date: string; status: 'present' | 'absent' | 'late'; note?: string }): Promise<any> {
    const response = await this.request('/attendance', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data;
  }

  async bulkCreateAttendance(data: { groupId: string; date: string; attendanceRecords: Array<{ studentId: string; status: 'present' | 'absent' | 'late'; note?: string }> }): Promise<any> {
    const response = await this.request('/attendance/bulk', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data;
  }

  async getAttendanceByEnrollment(enrollmentId: string, startDate?: string, endDate?: string): Promise<any> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const query = params.toString();
    
    const response = await this.request(`/attendance/enrollment/${enrollmentId}${query ? `?${query}` : ''}`);
    return response.data;
  }

  async getAttendanceByGroup(groupId: string, startDate?: string, endDate?: string): Promise<any> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const query = params.toString();
    
    const response = await this.request(`/attendance/group/${groupId}${query ? `?${query}` : ''}`);
    return response.data;
  }

  async getAttendanceByStudent(studentId: string, startDate?: string, endDate?: string): Promise<any> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const query = params.toString();
    
    const response = await this.request(`/attendance/student/${studentId}${query ? `?${query}` : ''}`);
    return response.data;
  }

  async getAttendanceStats(groupId: string, startDate?: string, endDate?: string): Promise<any> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const query = params.toString();
    
    const response = await this.request(`/attendance/stats/${groupId}${query ? `?${query}` : ''}`);
    return response.data;
  }

  async updateAttendanceRecord(id: string, data: { status?: 'present' | 'absent' | 'late'; note?: string }): Promise<any> {
    const response = await this.request(`/attendance/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.data;
  }

  async deleteAttendanceRecord(id: string): Promise<void> {
    await this.request(`/attendance/${id}`, {
      method: 'DELETE',
    });
  }

  // New smart attendance methods
  async getGroupCurrentWeekAttendance(groupId: string): Promise<any> {
    const response = await this.request(`/attendance/group/${groupId}/current-week`);
    return response.data;
  }

  async getGroupAttendanceByDate(groupId: string, date: string): Promise<any> {
    const response = await this.request(`/attendance/group/${groupId}/date/${date}`);
    return response.data;
  }

  async checkGroupClassToday(groupId: string): Promise<{
    isClassToday: boolean;
    classDays: string[];
    today: string;
  }> {
    try {
      const response = await this.request(`/attendance/group/${groupId}/class-today`);
      if (response && response.data) {
        return response.data as {
          isClassToday: boolean;
          classDays: string[];
          today: string;
        };
      }
      return { 
        isClassToday: false, 
        classDays: [], 
        today: new Date().toLocaleDateString('en-CA') // YYYY-MM-DD format
      };
    } catch (error) {
      console.error('Error checking class today:', error);
      return { 
        isClassToday: false, 
        classDays: [], 
        today: new Date().toLocaleDateString('en-CA') // YYYY-MM-DD format
      };
    }
  }

  async getGroupMonthlyAttendance(groupId: string, year: number, month: number): Promise<{
    groupId: string;
    groupName: string;
    subject: string;
    teacher: string;
    classDays: string[];
    classDatesList: string[];
    students: Array<{
      id: string;
      firstName: string;
      lastName: string;
      enrollmentId: string;
    }>;
    attendanceRecords: any[];
  }> {
    try {
      const response = await this.request(`/attendance/group/${groupId}/monthly/${year}/${month}`);
      if (response && response.data) {
        return response.data as {
          groupId: string;
          groupName: string;
          subject: string;
          teacher: string;
          classDays: string[];
          classDatesList: string[];
          students: Array<{
            id: string;
            firstName: string;
            lastName: string;
            enrollmentId: string;
          }>;
          attendanceRecords: any[];
        };
      }
      return {
        groupId,
        groupName: '',
        subject: '',
        teacher: '',
        classDays: [],
        classDatesList: [],
        students: [],
        attendanceRecords: []
      };
    } catch (error) {
      console.error('Error fetching monthly attendance:', error);
      return {
        groupId,
        groupName: '',
        subject: '',
        teacher: '',
        classDays: [],
        classDatesList: [],
        students: [],
        attendanceRecords: []
      };
    }
  }

  // Event API methods
  async getEvents(page: number = 1, limit: number = 20, search?: string): Promise<{
    events: Event[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(search && { search }),
    });

    const response = await this.request(`/events?${params}`);
    return {
      events: (response.data as Event[]) || [],
      pagination: response.pagination || { page: 1, limit: 10, total: 0, totalPages: 0 }
    };
  }

  async getEventById(id: string): Promise<Event> {
    const response = await this.request(`/events/${id}`);
    if (!response.data) {
      throw new Error('Event not found');
    }
    return response.data as Event;
  }

  async createEvent(eventData: CreateEventRequest): Promise<Event> {
    const response = await this.request('/events', {
      method: 'POST',
      body: JSON.stringify(eventData),
    });
    if (!response.data) {
      throw new Error('Failed to create event');
    }
    return response.data as Event;
  }

  async updateEvent(id: string, eventData: UpdateEventRequest): Promise<Event> {
    const response = await this.request(`/events/${id}`, {
      method: 'PUT',
      body: JSON.stringify(eventData),
    });
    if (!response.data) {
      throw new Error('Failed to update event');
    }
    return response.data as Event;
  }

  async deleteEvent(id: string): Promise<void> {
    await this.request(`/events/${id}`, {
      method: 'DELETE',
    });
  }

  async enrollStudentInEvent(eventId: string, studentId: string): Promise<void> {
    await this.request(`/events/${eventId}/enroll`, {
      method: 'POST',
      body: JSON.stringify({ studentId }),
    });
  }

  async unenrollStudentFromEvent(eventId: string, studentId: string): Promise<void> {
    await this.request(`/events/${eventId}/students/${studentId}`, {
      method: 'DELETE',
    });
  }

  async bulkEnrollStudentsInEvent(eventId: string, studentIds: string[]): Promise<void> {
    await this.request(`/events/${eventId}/enroll-bulk`, {
      method: 'POST',
      body: JSON.stringify({ studentIds }),
    });
  }

  async enrollStudent(studentId: string, groupId: string): Promise<void> {
    await this.request('/students/enroll', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ studentId, groupId }),
    });
  }

  async unenrollStudent(studentId: string, groupId: string): Promise<void> {
    await this.request(`/students/${studentId}/groups/${groupId}`, {
      method: 'DELETE',
    });
  }

  async getStudentEnrollments(studentId: string): Promise<Array<{
    id: string;
    groupId: string;
    groupName?: string;
    subjectName?: string;
    teacherName?: string;
    classNumber: string;
    capacity: number;
    schedules: GroupSchedule[];
  }>> {
    const response = await this.request<Array<{
      id: string;
      groupId: string;
      groupName?: string;
      subjectName?: string;
      teacherName?: string;
      classNumber: string;
      capacity: number;
      schedules: GroupSchedule[];
    }>>(`/students/${studentId}/enrollments`);
    return response.data!;
  }

  // Payment Management
  // Create payment record
  async createPayment(paymentData: CreatePaymentRequest): Promise<Payment> {
    const response = await this.request('/payments', {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });
    if (!response.data) {
      throw new Error('Failed to create payment');
    }
    return response.data as Payment;
  }

  // Get payments with filtering
  async getPayments(filters: PaymentFilters = {}): Promise<{
    payments: Payment[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, String(value));
      }
    });
    
    const response = await this.request(`/payments?${queryParams.toString()}`);
    return {
      payments: Array.isArray(response.data) ? response.data : [],
      pagination: response.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 }
    };
  }

  // Get payment by ID
  async getPaymentById(paymentId: string): Promise<Payment> {
    const response = await this.request(`/payments/${paymentId}`);
    if (!response.data) {
      throw new Error('Payment not found');
    }
    return response.data as Payment;
  }

  // Update payment
  async updatePayment(paymentId: string, updateData: UpdatePaymentRequest): Promise<Payment> {
    const response = await this.request(`/payments/${paymentId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
    if (!response.data) {
      throw new Error('Failed to update payment');
    }
    return response.data as Payment;
  }

  // Delete payment
  async deletePayment(paymentId: string): Promise<void> {
    await this.request(`/payments/${paymentId}`, {
      method: 'DELETE',
    });
  }

  // Get student payments
  async getStudentPayments(studentId: string, limit?: number): Promise<Payment[]> {
    const response = await this.request(`/payments/student/${studentId}${limit ? `?limit=${limit}` : ''}`);
    return Array.isArray(response.data) ? response.data : [];
  }

  // Get student monthly payment status
  async getStudentMonthlyStatus(studentId: string): Promise<MonthlyPaymentStatus[]> {
    const response = await this.request(`/payments/student/${studentId}/monthly-status`);
    return Array.isArray(response.data) ? response.data : [];
  }

  // Get payment summary/analytics
  async getPaymentSummary(month?: string): Promise<PaymentSummary> {
    const response = await this.request(`/payments/summary${month ? `?month=${month}` : ''}`);
    return response.data ? response.data as PaymentSummary : {
      totalAmount: 0,
      paidAmount: 0,
      pendingAmount: 0,
      overdueAmount: 0,
      paymentCount: 0,
      paidCount: 0,
      pendingCount: 0,
      overdueCount: 0
    };
  }

  // Record payment (simplified method)
  async recordPayment(paymentData: RecordPaymentRequest): Promise<Payment> {
    const response = await this.request('/payments/record', {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });
    if (!response.data) {
      throw new Error('Failed to record payment');
    }
    return response.data as Payment;
  }

  // Mark payment as paid
  async markPaymentAsPaid(paymentId: string, data: MarkPaidRequest): Promise<Payment> {
    const response = await this.request(`/payments/${paymentId}/mark-paid`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    if (!response.data) {
      throw new Error('Failed to mark payment as paid');
    }
    return response.data as Payment;
  }
}

export const apiService = new ApiService();
export default apiService;
export type { 
  User, 
  Center, 
  CreateCenterRequest, 
  CreateCenterAdminRequest, 
  SignupRequest,
  LoginRequest, 
  LoginResponse, 
  Year, 
  Field, 
  CreateYearRequest, 
  UpdateYearRequest, 
  CreateFieldRequest, 
  UpdateFieldRequest,
  Subject,
  Teacher,
  Group,
  Student,
  CreateSubjectRequest,
  UpdateSubjectRequest,
  CreateTeacherRequest,
  UpdateTeacherRequest,
  CreateGroupRequest,
  UpdateGroupRequest,
  CreateStudentRequest,
  UpdateStudentRequest,
  StudentsResponse,
  GroupSchedule,
  Event,
  EventSchedule,
  EventEnrollment,
  EventGroup,
  CreateEventRequest,
  UpdateEventRequest,
  Payment,
  CreatePaymentRequest,
  UpdatePaymentRequest,
  RecordPaymentRequest,
  MarkPaidRequest,
  PaymentFilters,
  PaymentSummary,
  MonthlyPaymentStatus
};
