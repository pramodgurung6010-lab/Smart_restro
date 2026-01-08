import React from 'react';
import { 
  LayoutDashboard, 
  Utensils, 
  Table as TableIcon, 
  Receipt, 
  BarChart3, 
  Users, 
  Settings, 
  UserCircle
} from 'lucide-react';
import { TableStatus, UserRole } from './types';

export const INITIAL_MENU = [
  { id: '1', name: 'Margherita Pizza', category: 'Main', price: 299, available: true },
  { id: '2', name: 'Caesar Salad', category: 'Starters', price: 199, available: true },
  { id: '3', name: 'Grilled Salmon', category: 'Main', price: 599, available: true },
  { id: '4', name: 'Tiramisu', category: 'Dessert', price: 149, available: true },
  { id: '5', name: 'Iced Tea', category: 'Beverage', price: 79, available: true },
  { id: '6', name: 'Pasta Carbonara', category: 'Main', price: 349, available: true },
  { id: '7', name: 'Garlic Bread', category: 'Starters', price: 99, available: true },
];

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
  { id: 'dashboard', label: 'Dashboard', icon: React.createElement(LayoutDashboard, { size: 20 }), roles: [UserRole.ADMIN] },
  { id: 'menu', label: 'Menu Management', icon: React.createElement(Utensils, { size: 20 }), roles: [UserRole.ADMIN] },
  { id: 'tables', label: 'Table Map', icon: React.createElement(TableIcon, { size: 20 }), roles: [UserRole.ADMIN, UserRole.WAITER] },
  { id: 'orders', label: 'Live Orders', icon: React.createElement(Receipt, { size: 20 }), roles: [UserRole.ADMIN, UserRole.WAITER, UserRole.KITCHEN] },
  { id: 'billing', label: 'Billing', icon: React.createElement(Receipt, { size: 20 }), roles: [UserRole.ADMIN, UserRole.WAITER] },
  { id: 'reports', label: 'Analytics', icon: React.createElement(BarChart3, { size: 20 }), roles: [UserRole.ADMIN] },
  { id: 'users', label: 'Staff Management', icon: React.createElement(Users, { size: 20 }), roles: [UserRole.ADMIN] },
  { id: 'profile', label: 'My Account', icon: React.createElement(UserCircle, { size: 20 }), roles: [UserRole.ADMIN, UserRole.WAITER, UserRole.KITCHEN] },
];