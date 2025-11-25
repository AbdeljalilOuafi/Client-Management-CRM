/**
 * Temporary frontend storage for app access data
 * This will be replaced with backend API once it's ready
 */

const APP_ACCESS_STORAGE_KEY = 'staff_app_access';

export interface AppAccessData {
  employeeId: number;
  app_access: {
    fithq: boolean;
    gohighlevel: boolean;
  };
  gohighlevel_permissions?: string[];
}

// Get all app access data from localStorage
export const getAllAppAccess = (): AppAccessData[] => {
  if (typeof window === 'undefined') return [];
  
  const stored = localStorage.getItem(APP_ACCESS_STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
};

// Get app access for a specific employee
export const getAppAccess = (employeeId: number): AppAccessData | null => {
  const allData = getAllAppAccess();
  return allData.find(data => data.employeeId === employeeId) || null;
};

// Save app access for an employee
export const saveAppAccess = (data: AppAccessData): void => {
  const allData = getAllAppAccess();
  const existingIndex = allData.findIndex(d => d.employeeId === data.employeeId);
  
  if (existingIndex >= 0) {
    // Update existing
    allData[existingIndex] = data;
  } else {
    // Add new
    allData.push(data);
  }
  
  localStorage.setItem(APP_ACCESS_STORAGE_KEY, JSON.stringify(allData));
  console.log('[AppAccessStorage] Saved app access for employee:', data.employeeId, data);
};

// Delete app access for an employee
export const deleteAppAccess = (employeeId: number): void => {
  const allData = getAllAppAccess();
  const filtered = allData.filter(d => d.employeeId !== employeeId);
  localStorage.setItem(APP_ACCESS_STORAGE_KEY, JSON.stringify(filtered));
};

// Merge app access data with employee list
export const mergeAppAccessWithEmployees = <T extends { id: number; email: string }>(employees: T[]): T[] => {
  const allAppAccess = getAllAppAccess();
  console.log('[AppAccessStorage] Merging app access data:', {
    totalEmployees: employees.length,
    storedAppAccessCount: allAppAccess.length,
    storedData: allAppAccess,
  });
  
  return employees.map(employee => {
    // First check if we have ID-based storage
    let appAccessData = getAppAccess(employee.id);
    
    // If not, check for temporary email-based storage
    if (!appAccessData && employee.email) {
      const tempKey = `temp_${employee.email}`;
      const tempData = localStorage.getItem(tempKey);
      if (tempData) {
        try {
          const parsed = JSON.parse(tempData);
          console.log('[AppAccessStorage] Found temp data for email:', employee.email, 'converting to ID:', employee.id);
          
          // Save with proper ID
          saveAppAccess({
            employeeId: employee.id,
            app_access: parsed.app_access,
            gohighlevel_permissions: parsed.gohighlevel_permissions,
          });
          
          // Remove temp storage
          localStorage.removeItem(tempKey);
          
          // Get the newly saved data
          appAccessData = getAppAccess(employee.id);
        } catch (e) {
          console.error('[AppAccessStorage] Error parsing temp data:', e);
        }
      }
    }
    
    if (appAccessData) {
      console.log('[AppAccessStorage] Found app access for employee:', employee.id, appAccessData);
      return {
        ...employee,
        app_access: appAccessData.app_access,
        gohighlevel_permissions: appAccessData.gohighlevel_permissions,
      };
    }
    return employee;
  });
};
