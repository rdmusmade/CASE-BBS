'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/common/Providers';
import { Navbar } from '@/components/Navbar';
import { Sidebar } from '@/components/Sidebar';
import {
  Shield,
  Users,
  FolderKanban,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  UserCheck,
  UserPlus,
  Building,
  Phone,
  Eye,
  X,
  Search,
  Lock,
  Edit2,
  Trash2,
  Ban,
  Clock,
  Sparkles,
  UserX,
  MapPin,
  Calendar,
} from 'lucide-react';
import confetti from 'canvas-confetti';

function AdminContent() {
  const { user, status } = useAuth();
  const searchParams = useSearchParams();

  // Tab State: Synchronized with query parameter
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<'USERS' | 'PROJECTS'>(
    tabParam === 'projects' ? 'PROJECTS' : 'USERS'
  );

  useEffect(() => {
    if (tabParam === 'projects') {
      setActiveTab('PROJECTS');
    } else {
      setActiveTab('USERS');
    }
  }, [tabParam]);

  // Metrics & Data
  const [metrics, setMetrics] = useState<any | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [allProjects, setAllProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [projectSearchQuery, setProjectSearchQuery] = useState('');

  // Add User Modal State
  const [addUserModalOpen, setAddUserModalOpen] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserCompany, setNewUserCompany] = useState('');
  const [newUserPhone, setNewUserPhone] = useState('');
  const [newUserAddress, setNewUserAddress] = useState('');
  const [newUserRole, setNewUserRole] = useState<'STANDARD_USER' | 'SYSTEM_ADMIN'>('STANDARD_USER');
  const [newUserSubPlan, setNewUserSubPlan] = useState<'14_DAYS_TRIAL' | '30_DAYS_MONTHLY' | '365_DAYS_YEARLY'>('14_DAYS_TRIAL');
  const [creatingUser, setCreatingUser] = useState(false);

  // Edit User Modal State
  const [editUserModalOpen, setEditUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editCompany, setEditCompany] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editRole, setEditRole] = useState<'STANDARD_USER' | 'SYSTEM_ADMIN'>('STANDARD_USER');
  const [editNewPassword, setEditNewPassword] = useState('');
  const [editExpiryDate, setEditExpiryDate] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  // Award Subscription Modal State
  const [awardSubModalOpen, setAwardSubModalOpen] = useState(false);
  const [targetSubUser, setTargetSubUser] = useState<any | null>(null);
  const [subType, setSubType] = useState<'14_DAYS_TRIAL' | '30_DAYS_MONTHLY' | '365_DAYS_YEARLY' | 'CUSTOM'>('14_DAYS_TRIAL');
  const [customDays, setCustomDays] = useState<number>(60);
  const [awardingSub, setAwardingSub] = useState(false);

  // Project Inspection Modal (Strictly Read-Only)
  const [inspectModalOpen, setInspectModalOpen] = useState(false);
  const [inspectingProject, setInspectingProject] = useState<any | null>(null);
  const [inspectLoading, setInspectLoading] = useState(false);

  // Project Delete Confirmation Modal (Admin Password Required)
  const [deleteProjectModalOpen, setDeleteProjectModalOpen] = useState(false);
  const [targetProjectToDelete, setTargetProjectToDelete] = useState<any | null>(null);
  const [adminDeletePassword, setAdminDeletePassword] = useState('');
  const [deletingProjectLoading, setDeletingProjectLoading] = useState(false);
  const [deleteProjectError, setDeleteProjectError] = useState<string | null>(null);

  const isSystemAdmin =
    user?.role === 'SYSTEM_ADMIN' ||
    user?.email === 'admin' ||
    user?.email === 'admin@smartbbs.com' ||
    user?.email === 'creativeassociates17@gmail.com';

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [metricsRes, projectsRes] = await Promise.all([
        fetch('/api/admin/metrics'),
        fetch('/api/admin/projects'),
      ]);

      const metricsData = await metricsRes.json();
      if (metricsData.success) {
        setMetrics(metricsData.metrics);
        setUsers(metricsData.users || []);
      }

      const projectsData = await projectsRes.json();
      if (projectsData.success) {
        setAllProjects(projectsData.projects || []);
      }
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isSystemAdmin) {
      fetchAdminData();
    }
  }, [isSystemAdmin]);

  // ACTION: Quick Approve User (Grants 14-Day Free Trial)
  const handleQuickApprove = async (userId: string, email: string) => {
    setActionLoadingId(userId);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          action: 'AWARD_SUBSCRIPTION',
          durationType: '14_DAYS_TRIAL',
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        confetti({ particleCount: 30, spread: 50, origin: { y: 0.7 } });
        await fetchAdminData();
      } else {
        alert(data.error || 'Failed to approve user');
      }
    } catch (e: any) {
      alert(e.message || 'Error approving user');
    } finally {
      setActionLoadingId(null);
    }
  };

  // ACTION: Reject User Registration
  const handleRejectUser = async (userId: string, email: string) => {
    if (!confirm(`Are you sure you want to REJECT the registration request for '${email}'?`)) {
      return;
    }
    setActionLoadingId(userId);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action: 'REJECT_USER' }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        await fetchAdminData();
      } else {
        alert(data.error || 'Failed to reject user');
      }
    } catch (e: any) {
      alert(e.message || 'Error rejecting user');
    } finally {
      setActionLoadingId(null);
    }
  };

  // ACTION: Suspend User Login
  const handleSuspendUser = async (userId: string, email: string) => {
    if (
      !confirm(
        `Are you sure you want to SUSPEND the login for '${email}'? They will be locked out immediately until reactivated.`
      )
    ) {
      return;
    }
    setActionLoadingId(userId);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action: 'SUSPEND_USER' }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        await fetchAdminData();
      } else {
        alert(data.error || 'Failed to suspend user');
      }
    } catch (e: any) {
      alert(e.message || 'Error suspending user');
    } finally {
      setActionLoadingId(null);
    }
  };

  // ACTION: Delete User Account
  const handleDeleteUser = async (userId: string, email: string) => {
    if (
      !confirm(
        `WARNING: Are you sure you want to permanently DELETE user '${email}' and ALL their projects? This cannot be undone.`
      )
    ) {
      return;
    }
    setActionLoadingId(userId);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action: 'DELETE_USER' }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        await fetchAdminData();
      } else {
        alert(data.error || 'Failed to delete user');
      }
    } catch (e: any) {
      alert(e.message || 'Error deleting user');
    } finally {
      setActionLoadingId(null);
    }
  };

  // ACTION: Open Edit Modal
  const openEditModal = (u: any) => {
    setEditingUser(u);
    setEditName(u.name || '');
    setEditEmail(u.email || '');
    setEditCompany(u.companyName || '');
    setEditPhone(u.phone || '');
    setEditAddress(u.address || '');
    setEditRole(u.role === 'SYSTEM_ADMIN' ? 'SYSTEM_ADMIN' : 'STANDARD_USER');
    setEditNewPassword('');
    setEditExpiryDate(
      u.subscriptionExpiresAt ? new Date(u.subscriptionExpiresAt).toISOString().split('T')[0] : ''
    );
    setEditUserModalOpen(true);
  };

  // ACTION: Save User Edits
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setSavingEdit(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'UPDATE_USER',
          userId: editingUser.id,
          name: editName,
          email: editEmail,
          companyName: editCompany,
          phone: editPhone,
          address: editAddress,
          role: editRole,
          newPassword: editNewPassword || undefined,
          expiryDate: editExpiryDate ? new Date(editExpiryDate).toISOString() : null,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setEditUserModalOpen(false);
        await fetchAdminData();
      } else {
        alert(data.error || 'Failed to update user');
      }
    } catch (e: any) {
      alert(e.message || 'Error saving user details');
    } finally {
      setSavingEdit(false);
    }
  };

  // ACTION: Open Award Subscription Modal
  const openAwardModal = (u: any) => {
    setTargetSubUser(u);
    setSubType('14_DAYS_TRIAL');
    setAwardSubModalOpen(true);
  };

  // ACTION: Submit Award Subscription
  const handleAwardSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetSubUser) return;
    setAwardingSub(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'AWARD_SUBSCRIPTION',
          userId: targetSubUser.id,
          durationType: subType,
          customDays: subType === 'CUSTOM' ? customDays : undefined,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        confetti({ particleCount: 35, spread: 60, origin: { y: 0.8 } });
        setAwardSubModalOpen(false);
        await fetchAdminData();
      } else {
        alert(data.error || 'Failed to award subscription');
      }
    } catch (e: any) {
      alert(e.message || 'Error awarding subscription');
    } finally {
      setAwardingSub(false);
    }
  };

  // ACTION: Create New User
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserEmail || !newUserPassword) {
      alert('Email / Login ID and password are required.');
      return;
    }

    setCreatingUser(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CREATE_USER',
          name: newUserName,
          email: newUserEmail,
          password: newUserPassword,
          companyName: newUserCompany,
          phone: newUserPhone,
          address: newUserAddress,
          role: newUserRole,
          subscriptionType: newUserSubPlan,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        confetti({ particleCount: 40, spread: 50, origin: { y: 0.8 } });
        setAddUserModalOpen(false);
        setNewUserName('');
        setNewUserEmail('');
        setNewUserPassword('');
        setNewUserCompany('');
        setNewUserPhone('');
        setNewUserAddress('');
        await fetchAdminData();
      } else {
        alert(data.error || 'Failed to create user');
      }
    } catch (err: any) {
      alert(err.message || 'Error creating user');
    } finally {
      setCreatingUser(false);
    }
  };

  // Inspect Project in Read-Only Mode
  const handleInspectProject = async (projectId: string) => {
    setInspectLoading(true);
    setInspectModalOpen(true);
    try {
      const res = await fetch(`/api/admin/projects?id=${projectId}`);
      const data = await res.json();
      if (data.success && data.project) {
        setInspectingProject(data.project);
      } else {
        alert(data.error || 'Failed to fetch project details');
      }
    } catch (err: any) {
      alert(err.message || 'Error fetching project');
    } finally {
      setInspectLoading(false);
    }
  };

  // Admin Project Deletion with Password Verification
  const handleConfirmDeleteProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetProjectToDelete) return;

    if (!adminDeletePassword || adminDeletePassword.trim() !== '2484553644') {
      setDeleteProjectError('Incorrect administrator password. Please enter the master password (2484553644).');
      return;
    }

    setDeletingProjectLoading(true);
    setDeleteProjectError(null);

    try {
      const res = await fetch('/api/admin/projects', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: targetProjectToDelete.id,
          adminPassword: adminDeletePassword.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete project');
      }

      alert(`Project '${targetProjectToDelete.projectName}' and all its BBS schedules have been deleted permanently.`);
      setDeleteProjectModalOpen(false);
      setTargetProjectToDelete(null);
      setAdminDeletePassword('');
      if (inspectModalOpen) setInspectModalOpen(false);
      await fetchAdminData();
    } catch (err: any) {
      setDeleteProjectError(err.message || 'Error deleting project');
    } finally {
      setDeletingProjectLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans">
        <Navbar />
        <div className="flex-1 flex items-center justify-center gap-3 text-sm text-slate-500 dark:text-slate-400">
          <RefreshCw className="w-5 h-5 animate-spin text-amber-500" />
          <span>Verifying administrator permissions...</span>
        </div>
      </div>
    );
  }

  if (!isSystemAdmin) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans">
        <Navbar />
        <div className="max-w-md mx-auto my-auto p-8 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl space-y-4">
          <Shield className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            System Admin Access Required
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            This console is restricted to Creative Associate LLP (Admin ID: <code className="text-amber-500 font-bold">admin</code>).
          </p>
        </div>
      </div>
    );
  }

  const filteredUsers = users.filter((u) => {
    const q = userSearchQuery.toLowerCase();
    return (
      (u.name || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      (u.companyName || '').toLowerCase().includes(q) ||
      (u.phone || '').includes(q)
    );
  });

  const filteredProjects = allProjects.filter((p) => {
    const q = projectSearchQuery.toLowerCase();
    return (
      (p.projectName || '').toLowerCase().includes(q) ||
      (p.user?.name || '').toLowerCase().includes(q) ||
      (p.user?.email || '').toLowerCase().includes(q) ||
      (p.clientName || '').toLowerCase().includes(q) ||
      (p.contractorName || '').toLowerCase().includes(q)
    );
  });

  // Calculate Status Badge Helper
  const getSubscriptionBadge = (u: any) => {
    if (u.role === 'SYSTEM_ADMIN' || u.email === 'admin') {
      return (
        <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40 inline-flex items-center gap-1">
          <Shield className="w-3 h-3 text-amber-500" />
          MASTER ADMIN
        </span>
      );
    }
    if (u.subscriptionStatus === 'SUSPENDED') {
      return (
        <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/40 inline-flex items-center gap-1">
          <Ban className="w-3 h-3 text-rose-500" />
          SUSPENDED
        </span>
      );
    }
    if (u.subscriptionStatus === 'REJECTED') {
      return (
        <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/40 inline-flex items-center gap-1">
          <UserX className="w-3 h-3 text-rose-500" />
          REJECTED
        </span>
      );
    }
    if (!u.isApprovedByAdmin || u.subscriptionStatus === 'PENDING') {
      return (
        <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40 inline-flex items-center gap-1">
          <Clock className="w-3 h-3 text-amber-500" />
          PENDING APPROVAL
        </span>
      );
    }
    if (u.subscriptionExpiresAt) {
      const now = new Date();
      const expiry = new Date(u.subscriptionExpiresAt);
      const diffMs = expiry.getTime() - now.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      if (diffDays <= 0) {
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/40 inline-flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-rose-500" />
            EXPIRED
          </span>
        );
      }
      return (
        <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40 inline-flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
          ACTIVE ({diffDays}d left)
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40 inline-flex items-center gap-1">
        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
        ACTIVE
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      <Navbar />

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar strictly shows "Admin Console" and "Projects" */}
        <Sidebar isSystemAdmin={true} />

        <main className="flex-1 overflow-y-auto p-4 sm:p-8 relative bg-slate-50 dark:bg-slate-950">
          {/* Subtle Ambient Glow */}
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-amber-500/10 dark:bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-7xl mx-auto space-y-6 relative z-10 w-full">
            {/* Header */}
            <div className="p-6 rounded-3xl bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200 dark:border-slate-800/80 shadow-md dark:shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                    Creative Associate LLP
                  </span>
                  <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Admin ID: admin
                  </span>
                </div>
                <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                  {activeTab === 'USERS' ? 'Admin Console: User Governance' : 'Projects: All User Projects Inspection'}
                </h1>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  {activeTab === 'USERS'
                    ? 'Add, edit, delete, approve, reject, update details of users, and award 14-day trials or subscriptions.'
                    : 'Inspect bar bending schedules and structural projects created by all users in read-only mode.'}
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {activeTab === 'USERS' && (
                  <button
                    onClick={() => setAddUserModalOpen(true)}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-2 shadow-md shadow-amber-500/20 transition-all"
                  >
                    <UserPlus className="w-4 h-4" />
                    + Add User Account
                  </button>
                )}

                <button
                  onClick={fetchAdminData}
                  disabled={loading}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold flex items-center gap-2 transition-all border border-slate-300 dark:border-slate-700 shadow-sm"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>
            </div>

            {/* Metrics Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-5 rounded-3xl bg-white/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 backdrop-blur-xl shadow-sm">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                  Registered Users
                </span>
                <span className="text-3xl font-black text-slate-900 dark:text-slate-100">
                  {metrics?.totalUsers || 0}
                </span>
                <span className="text-[11px] text-amber-600 dark:text-amber-400 block mt-1 font-semibold">
                  Engineers & Clients
                </span>
              </div>

              <div className="p-5 rounded-3xl bg-white/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 backdrop-blur-xl shadow-sm">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                  Total BBS Projects
                </span>
                <span className="text-3xl font-black text-slate-900 dark:text-slate-100">
                  {allProjects.length}
                </span>
                <span className="text-[11px] text-sky-600 dark:text-sky-400 block mt-1 font-semibold">
                  Across all users
                </span>
              </div>

              <div className="p-5 rounded-3xl bg-white/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 backdrop-blur-xl shadow-sm">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                  Structural Members
                </span>
                <span className="text-3xl font-black text-slate-900 dark:text-slate-100">
                  {metrics?.totalMembers || 0}
                </span>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 block mt-1 font-semibold">
                  Beams, Footings, Columns
                </span>
              </div>

              <div className="p-5 rounded-3xl bg-white/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 backdrop-blur-xl shadow-sm">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                  Rebar Items Calculated
                </span>
                <span className="text-3xl font-black text-amber-600 dark:text-amber-400">
                  {metrics?.totalRebarItems || 0}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-1 font-mono">
                  ~{metrics?.estimatedTotalSteelOptimizedMT || 0} MT Steel
                </span>
              </div>
            </div>

            {/* Two Primary Admin Modules: 1. "Admin Console" vs 2. "Projects" */}
            <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
              <button
                onClick={() => setActiveTab('USERS')}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                  activeTab === 'USERS'
                    ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`}
              >
                <Shield className="w-4 h-4" />
                Admin Console (User Accounts & Approvals: {users.length})
              </button>

              <button
                onClick={() => setActiveTab('PROJECTS')}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                  activeTab === 'PROJECTS'
                    ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`}
              >
                <FolderKanban className="w-4 h-4" />
                Projects (Read-Only Inspection: {allProjects.length})
              </button>
            </div>

            {/* ============================================================== */}
            {/* MODULE 1: ADMIN CONSOLE (ADD, EDIT, DELETE, APPROVE, REJECT)  */}
            {/* ============================================================== */}
            {activeTab === 'USERS' && (
              <div className="p-6 rounded-3xl bg-white/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 backdrop-blur-xl space-y-4 shadow-sm transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 gap-3">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <Users className="w-5 h-5 text-amber-500" />
                      User Authorization & Subscription Management
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Approve new registrations, reject invalid requests, award 14-day trials or monthly (₹150) / yearly (₹1,095) subscriptions, edit user details, or suspend logins.
                    </p>
                  </div>

                  <div className="relative w-full sm:w-64">
                    <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search users..."
                      value={userSearchQuery}
                      onChange={(e) => setUserSearchQuery(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-9 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500 transition-colors"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        <th className="py-3 px-3">Engineer / User</th>
                        <th className="py-3 px-3">Company & Contact</th>
                        <th className="py-3 px-3">Projects</th>
                        <th className="py-3 px-3">Plan & Expiry</th>
                        <th className="py-3 px-3 text-center">Status</th>
                        <th className="py-3 px-3 text-right">Admin Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 text-xs">
                      {filteredUsers.map((u) => {
                        const isPrimaryAdmin = u.email === 'admin';
                        const isSuspended = u.subscriptionStatus === 'SUSPENDED';
                        const isPending = !u.isApprovedByAdmin || u.subscriptionStatus === 'PENDING';

                        return (
                          <tr
                            key={u.id}
                            className="hover:bg-slate-100/60 dark:hover:bg-slate-800/20 transition-colors"
                          >
                            <td className="py-3.5 px-3">
                              <span className="font-bold text-slate-900 dark:text-slate-100 block">
                                {u.name || 'Unnamed'}
                              </span>
                              <span className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                                {u.email}
                              </span>
                            </td>

                            <td className="py-3.5 px-3">
                              <span className="text-slate-800 dark:text-slate-300 font-semibold block flex items-center gap-1">
                                <Building className="w-3 h-3 text-slate-400" />
                                {u.companyName || '-'}
                              </span>
                              <span className="text-slate-500 dark:text-slate-400 text-[11px] flex items-center gap-1">
                                <Phone className="w-3 h-3 text-slate-400" />
                                {u.phone || '-'}
                              </span>
                            </td>

                            <td className="py-3.5 px-3 font-mono font-bold text-slate-800 dark:text-slate-200">
                              {u._count?.projects || 0} projects
                            </td>

                            <td className="py-3.5 px-3">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-amber-700 dark:text-amber-300 border border-slate-300 dark:border-slate-700 block w-fit mb-1">
                                {u.planTier}
                              </span>
                              <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-mono">
                                {u.subscriptionExpiresAt
                                  ? `Expires: ${new Date(u.subscriptionExpiresAt).toLocaleDateString()}`
                                  : 'No Expiry Set'}
                              </span>
                            </td>

                            <td className="py-3.5 px-3 text-center">
                              {getSubscriptionBadge(u)}
                            </td>

                            <td className="py-3.5 px-3 text-right">
                              {isPrimaryAdmin ? (
                                <span className="text-xs text-amber-600 dark:text-amber-400 font-mono italic">
                                  Primary Admin
                                </span>
                              ) : (
                                <div className="flex items-center justify-end gap-1.5 flex-wrap">
                                  {/* PENDING ACTIONS: Quick Approve vs Reject */}
                                  {isPending && (
                                    <>
                                      <button
                                        onClick={() => handleQuickApprove(u.id, u.email)}
                                        disabled={actionLoadingId === u.id}
                                        className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm transition-all"
                                        title="Approve registration with 14-day free trial"
                                      >
                                        Approve
                                      </button>
                                      <button
                                        onClick={() => handleRejectUser(u.id, u.email)}
                                        disabled={actionLoadingId === u.id}
                                        className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 text-xs font-bold transition-all"
                                        title="Reject registration"
                                      >
                                        Reject
                                      </button>
                                    </>
                                  )}

                                  {/* AWARD / CHANGE SUBSCRIPTION */}
                                  <button
                                    onClick={() => openAwardModal(u)}
                                    disabled={actionLoadingId === u.id}
                                    className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-xs font-bold transition-all"
                                    title="Award or Extend Subscription (14d Trial, Monthly @ ₹150, Yearly @ ₹1095)"
                                  >
                                    Award Plan
                                  </button>

                                  {/* SUSPEND / REACTIVATE */}
                                  {!isPending && (
                                    isSuspended ? (
                                      <button
                                        onClick={() => openAwardModal(u)}
                                        disabled={actionLoadingId === u.id}
                                        className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm transition-all"
                                        title="Reactivate Suspended Account"
                                      >
                                        Reactivate
                                      </button>
                                    ) : (
                                      <button
                                        onClick={() => handleSuspendUser(u.id, u.email)}
                                        disabled={actionLoadingId === u.id}
                                        className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 text-xs font-bold transition-all"
                                        title="Suspend Login"
                                      >
                                        Suspend
                                      </button>
                                    )
                                  )}

                                  {/* EDIT USER PROFILE DETAILS */}
                                  <button
                                    onClick={() => openEditModal(u)}
                                    disabled={actionLoadingId === u.id}
                                    className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 transition-colors"
                                    title="Edit User Details, Company, Phone & Password"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>

                                  {/* DELETE USER ACCOUNT */}
                                  <button
                                    onClick={() => handleDeleteUser(u.id, u.email)}
                                    disabled={actionLoadingId === u.id}
                                    className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 transition-colors"
                                    title="Delete User & Projects Permanently"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* MODULE 2: PROJECTS (STRICTLY READ-ONLY INSPECTION)             */}
            {/* ============================================================== */}
            {activeTab === 'PROJECTS' && (
              <div className="p-6 rounded-3xl bg-white/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 backdrop-blur-xl space-y-4 shadow-sm transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 gap-3">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <FolderKanban className="w-5 h-5 text-amber-500" />
                      All User BBS Projects (Read-Only Inspection Mode)
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      As System Administrator, you can inspect structural member schedules and bar bending schedules of all users without editing permissions.
                    </p>
                  </div>

                  <div className="relative w-full sm:w-64">
                    <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search projects or owners..."
                      value={projectSearchQuery}
                      onChange={(e) => setProjectSearchQuery(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-9 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500 transition-colors"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        <th className="py-3 px-3">Project Title</th>
                        <th className="py-3 px-3">Owner / Engineer</th>
                        <th className="py-3 px-3">Client & Contractor</th>
                        <th className="py-3 px-3 text-center">Members</th>
                        <th className="py-3 px-3">Created Date</th>
                        <th className="py-3 px-3 text-right">Inspection Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 text-xs">
                      {filteredProjects.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-500">
                            No projects found matching query.
                          </td>
                        </tr>
                      ) : (
                        filteredProjects.map((p) => (
                          <tr
                            key={p.id}
                            className="hover:bg-slate-100/60 dark:hover:bg-slate-800/20 transition-colors"
                          >
                            <td className="py-3.5 px-3 font-bold text-slate-900 dark:text-slate-100">
                              {p.projectName}
                            </td>
                            <td className="py-3.5 px-3">
                              <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                                {p.user?.name || 'User'}
                              </span>
                              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                                {p.user?.email}
                              </span>
                            </td>
                            <td className="py-3.5 px-3 text-slate-700 dark:text-slate-300">
                              <span className="block font-medium">{p.clientName || 'General Client'}</span>
                              <span className="text-[10px] text-slate-500 dark:text-slate-400">
                                {p.contractorName || 'Contractor'}
                              </span>
                            </td>
                            <td className="py-3.5 px-3 text-center font-mono font-bold text-amber-600 dark:text-amber-400">
                              {p._count?.members || 0}
                            </td>
                            <td className="py-3.5 px-3 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                              {new Date(p.createdDate || p.createdAt || Date.now()).toLocaleDateString()}
                            </td>
                            <td className="py-3.5 px-3 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handleInspectProject(p.id)}
                                  className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-xs font-bold inline-flex items-center gap-1.5 transition-all shadow-sm"
                                >
                                  <Eye className="w-3.5 h-3.5 text-amber-500" />
                                  Inspect BBS (Read-Only)
                                </button>
                                <button
                                  onClick={() => {
                                    setTargetProjectToDelete(p);
                                    setAdminDeletePassword('');
                                    setDeleteProjectError(null);
                                    setDeleteProjectModalOpen(true);
                                  }}
                                  className="px-2.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 dark:text-rose-400 border border-rose-500/30 text-xs font-bold inline-flex items-center gap-1.5 transition-all shadow-sm"
                                  title="Delete Project (Admin Password Required)"
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* ============================================================== */}
      {/* MODAL 1: ADD NEW USER ACCOUNT (BY ADMIN)                       */}
      {/* ============================================================== */}
      {addUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-amber-500" />
                <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
                  Add New User Account
                </h3>
              </div>
              <button
                onClick={() => setAddUserModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-6 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="e.g. Er. Ramesh Patil"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Email / Login ID *
                </label>
                <input
                  type="text"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="engineer@company.com"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Account Password *
                </label>
                <input
                  type="password"
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  placeholder="Create user password"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Company / Firm
                  </label>
                  <input
                    type="text"
                    value={newUserCompany}
                    onChange={(e) => setNewUserCompany(e.target.value)}
                    placeholder="e.g. Patil Infra"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={newUserPhone}
                    onChange={(e) => setNewUserPhone(e.target.value)}
                    placeholder="+91..."
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Office Address
                </label>
                <input
                  type="text"
                  value={newUserAddress}
                  onChange={(e) => setNewUserAddress(e.target.value)}
                  placeholder="e.g. Pune, Maharashtra"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Role
                  </label>
                  <select
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value as any)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                  >
                    <option value="STANDARD_USER">Standard Engineer</option>
                    <option value="SYSTEM_ADMIN">System Administrator</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Award Subscription
                  </label>
                  <select
                    value={newUserSubPlan}
                    onChange={(e) => setNewUserSubPlan(e.target.value as any)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                  >
                    <option value="14_DAYS_TRIAL">14-Day Free Trial (₹0)</option>
                    <option value="30_DAYS_MONTHLY">30-Day Monthly (₹150)</option>
                    <option value="365_DAYS_YEARLY">365-Day Yearly (₹1,095)</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAddUserModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingUser}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50"
                >
                  {creatingUser ? 'Creating...' : 'Create & Authorize'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 2: EDIT USER DETAILS & PASSWORD                           */}
      {/* ============================================================== */}
      {editUserModalOpen && editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60">
              <div className="flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-amber-500" />
                <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
                  Edit User Details
                </h3>
              </div>
              <button
                onClick={() => setEditUserModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Login ID / Email
                </label>
                <input
                  type="text"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Company / Firm
                  </label>
                  <input
                    type="text"
                    value={editCompany}
                    onChange={(e) => setEditCompany(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Office / Site Address
                </label>
                <input
                  type="text"
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Role
                  </label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as any)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                  >
                    <option value="STANDARD_USER">Standard Engineer</option>
                    <option value="SYSTEM_ADMIN">System Administrator</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Expiry Date
                  </label>
                  <input
                    type="date"
                    value={editExpiryDate}
                    onChange={(e) => setEditExpiryDate(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Reset Password <span className="text-slate-500 font-normal">(Leave blank to keep unchanged)</span>
                </label>
                <input
                  type="password"
                  value={editNewPassword}
                  onChange={(e) => setEditNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditUserModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50"
                >
                  {savingEdit ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 3: AWARD / EXTEND SUBSCRIPTION (₹150 / mo, ₹1095 / yr)    */}
      {/* ============================================================== */}
      {awardSubModalOpen && targetSubUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-500" />
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
                    Award / Renew Subscription
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    For {targetSubUser.name} ({targetSubUser.email})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setAwardSubModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAwardSubscription} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Select Subscription Plan Tier:
                </label>
                <div className="space-y-2">
                  <label
                    className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition-all ${
                      subType === '14_DAYS_TRIAL'
                        ? 'bg-amber-500/10 border-amber-500/80 text-amber-700 dark:text-amber-300'
                        : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-400'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="radio"
                        name="subType"
                        checked={subType === '14_DAYS_TRIAL'}
                        onChange={() => setSubType('14_DAYS_TRIAL')}
                        className="text-amber-500 focus:ring-amber-500"
                      />
                      <div>
                        <div className="text-xs font-bold">14-Day Free Trial</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">
                          Valid for 14 days from today. Auto-suspends after 14 days.
                        </div>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold">₹ 0 (14d)</span>
                  </label>

                  <label
                    className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition-all ${
                      subType === '30_DAYS_MONTHLY'
                        ? 'bg-amber-500/10 border-amber-500/80 text-amber-700 dark:text-amber-300'
                        : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-400'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="radio"
                        name="subType"
                        checked={subType === '30_DAYS_MONTHLY'}
                        onChange={() => setSubType('30_DAYS_MONTHLY')}
                        className="text-amber-500 focus:ring-amber-500"
                      />
                      <div>
                        <div className="text-xs font-bold">Monthly Pro License</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">
                          Runs for 30 days from today.
                        </div>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold text-sky-600 dark:text-sky-400">
                      ₹ 150 / mo
                    </span>
                  </label>

                  <label
                    className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition-all ${
                      subType === '365_DAYS_YEARLY'
                        ? 'bg-amber-500/10 border-amber-500/80 text-amber-700 dark:text-amber-300'
                        : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-400'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="radio"
                        name="subType"
                        checked={subType === '365_DAYS_YEARLY'}
                        onChange={() => setSubType('365_DAYS_YEARLY')}
                        className="text-amber-500 focus:ring-amber-500"
                      />
                      <div>
                        <div className="text-xs font-bold">Yearly Pro License</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">
                          Runs for 365 days from today (₹3/day).
                        </div>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      ₹ 1,095 / yr
                    </span>
                  </label>

                  <label
                    className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition-all ${
                      subType === 'CUSTOM'
                        ? 'bg-amber-500/10 border-amber-500/80 text-amber-700 dark:text-amber-300'
                        : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-400'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="radio"
                        name="subType"
                        checked={subType === 'CUSTOM'}
                        onChange={() => setSubType('CUSTOM')}
                        className="text-amber-500 focus:ring-amber-500"
                      />
                      <div>
                        <div className="text-xs font-bold">Custom Duration</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">
                          Specify custom validity days.
                        </div>
                      </div>
                    </div>
                    {subType === 'CUSTOM' ? (
                      <input
                        type="number"
                        min="1"
                        max="1825"
                        value={customDays}
                        onChange={(e) => setCustomDays(Number(e.target.value))}
                        className="w-20 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1 text-xs font-mono text-center text-amber-600 dark:text-amber-300 focus:outline-none focus:border-amber-500"
                      />
                    ) : (
                      <span className="text-xs font-mono">Custom</span>
                    )}
                  </label>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-xs space-y-1">
                <span className="text-slate-500 dark:text-slate-400 block text-[11px]">
                  Calculated New Expiry Date:
                </span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                  {(() => {
                    const d = new Date();
                    const add =
                      subType === '14_DAYS_TRIAL'
                        ? 14
                        : subType === '30_DAYS_MONTHLY'
                        ? 30
                        : subType === '365_DAYS_YEARLY'
                        ? 365
                        : customDays;
                    d.setDate(d.getDate() + add);
                    return d.toLocaleDateString(undefined, {
                      weekday: 'short',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    });
                  })()}
                </span>
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAwardSubModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={awardingSub}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50"
                >
                  {awardingSub ? 'Activating...' : 'Award & Activate Access'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 4: PROJECT INSPECTION MODAL (STRICTLY READ-ONLY)         */}
      {/* ============================================================== */}
      {inspectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/75 backdrop-blur-md">
          <div className="w-full max-w-5xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
                      {inspectingProject?.projectName || 'Project Inspection'}
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40">
                      Read-Only Inspection Mode
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Owner: {inspectingProject?.user?.name} ({inspectingProject?.user?.email}) • Firm:{' '}
                    {inspectingProject?.user?.companyName || '-'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setInspectModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {inspectLoading ? (
                <div className="py-20 text-center text-slate-500 flex items-center justify-center gap-2">
                  <RefreshCw className="w-5 h-5 animate-spin text-amber-500" />
                  <span>Loading project members and BBS schedule...</span>
                </div>
              ) : (
                <>
                  {/* Project Details Bar */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-xs">
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 block text-[10px]">
                        Client Name
                      </span>
                      <span className="font-bold text-slate-900 dark:text-slate-200">
                        {inspectingProject?.clientName || '-'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 block text-[10px]">
                        Contractor
                      </span>
                      <span className="font-bold text-slate-900 dark:text-slate-200">
                        {inspectingProject?.contractorName || '-'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 block text-[10px]">
                        RCC & Steel Grade
                      </span>
                      <span className="font-mono text-slate-900 dark:text-slate-200">
                        {inspectingProject?.rccGrade} • {inspectingProject?.rebarGrade}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 block text-[10px]">
                        Members Count
                      </span>
                      <span className="font-bold text-amber-600 dark:text-amber-400">
                        {inspectingProject?.members?.length || 0} Members
                      </span>
                    </div>
                  </div>

                  {/* Members & Itemized Rebar Table */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Structural Members & Bar Bending Schedule
                    </h4>

                    {!inspectingProject?.members || inspectingProject.members.length === 0 ? (
                      <div className="py-10 text-center text-slate-500 text-xs bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-slate-200 dark:border-slate-800">
                        No structural members have been added to this project yet.
                      </div>
                    ) : (
                      inspectingProject.members.map((member: any) => (
                        <div
                          key={member.id}
                          className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-amber-600 dark:text-amber-400 text-xs font-mono">
                              {member.memberTag} ({member.memberType})
                            </span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                              Cover: {member.clearCover}mm • {member.concreteGrade} • {member.steelGrade}
                            </span>
                          </div>

                          <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                              <thead>
                                <tr className="text-[10px] text-slate-500 border-b border-slate-200 dark:border-slate-800 uppercase">
                                  <th className="py-1.5 px-2">Mark</th>
                                  <th className="py-1.5 px-2">Shape</th>
                                  <th className="py-1.5 px-2">Dia</th>
                                  <th className="py-1.5 px-2">Count</th>
                                  <th className="py-1.5 px-2 text-right">Cut L (mm)</th>
                                  <th className="py-1.5 px-2 text-right">Weight (kg)</th>
                                  <th className="py-1.5 px-2">Description</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/40">
                                {(member.rebarItems || []).map((r: any) => {
                                  const cutLen = Number(r.calculatedCutLength) || 0;
                                  const count = Number(r.count) || 0;
                                  const dia = Number(r.dia) || 12;
                                  const unitWt = Number(r.unitWeight) || (dia * dia) / 162.2;
                                  const totalKg = ((count * cutLen) / 1000) * unitWt;
                                  return (
                                    <tr key={r.id}>
                                      <td className="py-1 px-2 font-mono text-slate-800 dark:text-slate-300">
                                        {r.barMark}
                                      </td>
                                      <td className="py-1 px-2 font-mono text-amber-600 dark:text-amber-400">
                                        Shape {r.shapeCode}
                                      </td>
                                      <td className="py-1 px-2 font-mono text-slate-900 dark:text-slate-200">
                                        Ø{r.dia}
                                      </td>
                                      <td className="py-1 px-2 font-mono text-slate-700 dark:text-slate-300">
                                        {r.count}
                                      </td>
                                      <td className="py-1 px-2 font-mono text-right text-slate-700 dark:text-slate-300">
                                        {cutLen}
                                      </td>
                                      <td className="py-1 px-2 font-mono text-right font-bold text-emerald-600 dark:text-emerald-400">
                                        {totalKg.toFixed(2)}
                                      </td>
                                      <td className="py-1 px-2 text-slate-500 dark:text-slate-400 text-[11px]">
                                        {r.remarks || '-'}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 flex items-center justify-between gap-3">
              <span className="text-xs text-slate-500 dark:text-slate-400 italic">
                * As System Admin, you are viewing this project in read-only inspection mode. User project data cannot be altered by Admin.
              </span>
              <div className="flex items-center gap-2">
                {inspectingProject && (
                  <button
                    onClick={() => {
                      setTargetProjectToDelete(inspectingProject);
                      setAdminDeletePassword('');
                      setDeleteProjectError(null);
                      setDeleteProjectModalOpen(true);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-600 dark:text-rose-400 border border-rose-500/30 text-xs font-bold inline-flex items-center gap-1.5 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                    Delete Project (Password Required)
                  </button>
                )}
                <button
                  onClick={() => setInspectModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold"
                >
                  Close Inspection
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 5: DELETE PROJECT (ADMIN PASSWORD REQUIRED)             */}
      {/* ============================================================== */}
      {deleteProjectModalOpen && targetProjectToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-rose-500/30 dark:border-rose-500/30 rounded-3xl overflow-hidden shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-rose-200 dark:border-rose-950/60 bg-rose-500/10 dark:bg-rose-950/30">
              <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
                <AlertTriangle className="w-5 h-5 text-rose-500" />
                <h3 className="text-base font-black">
                  Admin Project Deletion
                </h3>
              </div>
              <button
                onClick={() => setDeleteProjectModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmDeleteProject} className="p-6 space-y-4">
              <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 rounded-2xl p-3.5 text-xs text-rose-800 dark:text-rose-300 space-y-1.5">
                <p className="font-bold">⚠️ Irreversible Administrator Action</p>
                <p>
                  You are about to delete project <span className="font-mono font-bold underline">{targetProjectToDelete.projectName}</span> (Owner: {targetProjectToDelete.user?.name || targetProjectToDelete.user?.email || 'User'}).
                </p>
                <p className="text-[11px] text-rose-700/80 dark:text-rose-400/80">
                  This will permanently wipe all members, bar schedules, and calculated BBS metrics from the cloud database.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Enter Admin Master Password to Confirm
                </label>
                <input
                  type="password"
                  value={adminDeletePassword}
                  onChange={(e) => {
                    setAdminDeletePassword(e.target.value);
                    setDeleteProjectError(null);
                  }}
                  placeholder="Master Admin Password"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                  autoFocus
                  required
                />
              </div>

              {deleteProjectError && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-600 dark:text-red-400 text-xs font-medium">
                  {deleteProjectError}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setDeleteProjectModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={deletingProjectLoading || !adminDeletePassword}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-rose-600/20 disabled:opacity-50 transition-all"
                >
                  {deletingProjectLoading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" />
                      Confirm & Delete
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
          Loading Admin Platform...
        </div>
      }
    >
      <AdminContent />
    </Suspense>
  );
}
