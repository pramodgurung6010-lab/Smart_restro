import React from 'react';
import { 
  LayoutDashboard, 
  Utensils, 
  Table as TableIcon, 
  Receipt,
  ClipboardList,
  BarChart3, 
  Users, 
  UserCircle
} from 'lucide-react';
import { TableStatus, UserRole } from './types';

// 15 tables as per spec with specific capacities
export const INITIAL_TABLES = [
  { id: 't1', number: '01', capacity: 2, status: TableStatus.AVAILABLE },
  { id: 't2', number: '02', capacity: 2, status: TableStatus.AVAILABLE },
  { id: 't3', number: '03', capacity: 2, status: TableStatus.AVAILABLE },
  { id: 't4', number: '04', capacity: 2, status: TableStatus.AVAILABLE },
  { id: 't5', number: '05', capacity: 2, status: TableStatus.AVAILABLE },
  { id: 't6', number: '06', capacity: 4, status: TableStatus.AVAILABLE },
  { id: 't7', number: '07', capacity: 4, status: TableStatus.AVAILABLE },
  { id: 't8', number: '08', capacity: 4, status: TableStatus.AVAILABLE },
  { id: 't9', number: '09', capacity: 4, status: TableStatus.AVAILABLE },
  { id: 't10', number: '10', capacity: 4, status: TableStatus.AVAILABLE },
  // 8 Seater
  { id: 't11', number: '11', capacity: 8, status: TableStatus.AVAILABLE },
  { id: 't12', number: '12', capacity: 8, status: TableStatus.AVAILABLE },
  // 10 Seater
  { id: 't13', number: '13', capacity: 10, status: TableStatus.AVAILABLE },
  { id: 't14', number: '14', capacity: 4, status: TableStatus.AVAILABLE },
  { id: 't15', number: '15', capacity: 4, status: TableStatus.AVAILABLE },
];

export const CATEGORIES = ['All', 'Starters', 'Main', 'Dessert', 'Beverage'];

export const NAVIGATION_ITEMS = [
  { 
    id: 'dashboard', 
    label: 'Dashboard', 
    icon: <LayoutDashboard size={20} />, 
    roles: [UserRole.ADMIN] 
  },
  { 
    id: 'menu', 
    label: 'Menu Management', 
    icon: <Utensils size={20} />, 
    roles: [UserRole.ADMIN] 
  },
  { 
    id: 'tables', 
    label: 'Table Map', 
    icon: <TableIcon size={20} />, 
    roles: [UserRole.ADMIN, UserRole.WAITER] 
  },
  { 
    id: 'orders', 
    label: 'Live Orders', 
    icon: <ClipboardList size={20} />, 
    roles: [UserRole.ADMIN, UserRole.WAITER, UserRole.KITCHEN] 
  },
  { 
    id: 'billing', 
    label: 'Billing', 
    icon: <Receipt size={20} />, 
    roles: [UserRole.ADMIN, UserRole.WAITER] 
  },
  { 
    id: 'reports', 
    label: 'Analytics', 
    icon: <BarChart3 size={20} />, 
    roles: [UserRole.ADMIN] 
  },
  { 
    id: 'users', 
    label: 'Staff Management', 
    icon: <Users size={20} />, 
    roles: [UserRole.ADMIN] 
  },
  { 
    id: 'profile', 
    label: 'My Account', 
    icon: <UserCircle size={20} />, 
    roles: [UserRole.ADMIN, UserRole.WAITER, UserRole.KITCHEN] 
  },
];
