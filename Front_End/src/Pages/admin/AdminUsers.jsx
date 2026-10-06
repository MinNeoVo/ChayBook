import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertCircle,
  Ban,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  RefreshCw,
  Search,
  UserCheck,
  UserPlus,
  UserX,
  Users,
} from "lucide-react";

import {
  getAdminUsers,
  getAdminUserStatistics,
  updateAdminUserStatus,
} from "../../services/adminUserServices";

const PAGE_SIZE = 10;

const EMPTY_STATISTICS = {
  totalAccounts: 0,
  activeAccounts: 0,
  disabledAccounts: 0,
  newAccountsThisWeek: 0,
};

function formatCount(value) {
  return Number(value || 0).toLocaleString("en-US");
}

function formatJoinedDate(value) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function getInitials(user) {
  const label = user.fullName?.trim() || user.username?.trim() || "?";
  const parts = label.split(/\s+/).filter(Boolean);

  if (parts.length > 1) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }

  return label.slice(0, 2).toUpperCase();
}

function getPageItems(totalPages, page) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index);
  }

  const candidates = [...new Set([0, page - 1, page, page + 1, totalPages - 1])]
    .filter((item) => item >= 0 && item < totalPages)
    .sort((left, right) => left - right);
  const result = [];

  candidates.forEach((candidate, index) => {
    if (index > 0 && candidate - candidates[index - 1] > 1) {
      result.push(`ellipsis-${candidate}`);
    }
    result.push(candidate);
  });

  return result;
}

function StatCard({ title, value, Icon, tone, loading }) {
  const tones = {
    neutral: "bg-gray-50 text-gray-600 ring-gray-100",
    green: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    red: "bg-red-50 text-red-700 ring-red-100",
    blue: "bg-sky-50 text-sky-700 ring-sky-100",
  };

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <span className={`rounded-lg p-2 ring-1 ${tones[tone]}`}>
          <Icon aria-hidden="true" size={18} />
        </span>
      </div>
      <p className="mt-3 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
        {loading ? <span className="text-gray-300">—</span> : value}
      </p>
    </section>
  );
}

function StatusBadge({ status }) {
  const isActive = status?.toUpperCase() === "ACTIVE";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
        isActive
          ? "bg-emerald-50 text-emerald-700"
          : "bg-red-50 text-red-700"
      }`}
    >
      <span
        aria-hidden="true"
        className={`h-1.5 w-1.5 rounded-full ${
          isActive ? "bg-emerald-600" : "bg-red-600"
        }`}
      />
      {isActive ? "Active" : "Disabled"}
    </span>
  );
}

function UserManagementPage() {
  const [users, setUsers] = useState([]);
  const [statistics, setStatistics] = useState(EMPTY_STATISTICS);
  const [page, setPage] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingStatistics, setLoadingStatistics] = useState(true);
  const [error, setError] = useState("");
  const [statisticsError, setStatisticsError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [updatingUserId, setUpdatingUserId] = useState(null);
  const [actionError, setActionError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [statisticsRefreshKey, setStatisticsRefreshKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadUsers() {
      setLoadingUsers(true);
      setError("");

      try {
        const response = await getAdminUsers({
          page,
          size: PAGE_SIZE,
          signal: controller.signal,
        });

        if (!response || !Array.isArray(response.items)) {
          throw new TypeError("The admin users API returned an invalid response.");
        }

        setUsers(response.items);
        setTotalElements(Number(response.totalElements) || 0);
        setTotalPages(Number(response.totalPages) || 0);
      } catch (requestError) {
        if (!controller.signal.aborted) {
          console.error("Unable to load admin users:", requestError);
          setError("Unable to load users.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoadingUsers(false);
        }
      }
    }

    loadUsers();
    return () => controller.abort();
  }, [page, refreshKey]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadStatistics() {
      setLoadingStatistics(true);
      setStatisticsError("");

      try {
        const response = await getAdminUserStatistics({
          signal: controller.signal,
        });

        if (!response || typeof response !== "object") {
          throw new TypeError("The admin user statistics API returned an invalid response.");
        }

        setStatistics({
          totalAccounts: Number(response.totalAccounts) || 0,
          activeAccounts: Number(response.activeAccounts) || 0,
          disabledAccounts: Number(response.disabledAccounts) || 0,
          newAccountsThisWeek: Number(response.newAccountsThisWeek) || 0,
        });
      } catch (requestError) {
        if (!controller.signal.aborted) {
          console.error("Unable to load admin user statistics:", requestError);
          setStatisticsError("Unable to load account statistics.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoadingStatistics(false);
        }
      }
    }

    loadStatistics();
    return () => controller.abort();
  }, [statisticsRefreshKey]);

  const filteredUsers = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return users.filter((user) => {
      const matchesStatus =
        statusFilter === "ALL" || user.status?.toUpperCase() === statusFilter;
      const searchableText = [user.fullName, user.username, user.email]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return matchesStatus && searchableText.includes(normalizedSearch);
    });
  }, [users, search, statusFilter]);

  const pageItems = getPageItems(totalPages, page);
  const hasLocalFilter = Boolean(search.trim()) || statusFilter !== "ALL";
  const firstAccount = totalElements === 0 ? 0 : page * PAGE_SIZE + 1;
  const lastAccount = Math.min((page + 1) * PAGE_SIZE, totalElements);

  const refreshData = () => {
    setRefreshKey((current) => current + 1);
    setStatisticsRefreshKey((current) => current + 1);
  };

  const handleToggleStatus = async (user) => {
    const nextStatus = user.status?.toUpperCase() === "ACTIVE" ? "DISABLED" : "ACTIVE";

    setUpdatingUserId(user.userId);
    setActionError("");

    try {
      const response = await updateAdminUserStatus(user.userId, nextStatus);
      const updatedStatus = response?.status || nextStatus;

      setUsers((currentUsers) =>
        currentUsers.map((currentUser) =>
          currentUser.userId === user.userId
            ? { ...currentUser, status: updatedStatus }
            : currentUser,
        ),
      );
      setStatisticsRefreshKey((current) => current + 1);
    } catch (requestError) {
      console.error(`Unable to update status for user ${user.userId}:`, requestError);
      setActionError(requestError.message || "Unable to update user status.");
    } finally {
      setUpdatingUserId(null);
    }
  };

  return (
    <div className="mx-auto w-full min-w-0 max-w-[1500px] space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-chaybook-primary">
            <Users aria-hidden="true" size={15} />
            User Management
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
            User Management
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Monitor, inspect, and manage member accounts.
          </p>
        </div>

        <button
          type="button"
          onClick={refreshData}
          disabled={loadingUsers || loadingStatistics}
          className="inline-flex w-fit items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50 disabled:cursor-wait disabled:opacity-60"
        >
          <RefreshCw
            aria-hidden="true"
            size={16}
            className={loadingUsers || loadingStatistics ? "animate-spin" : ""}
          />
          Refresh
        </button>
      </header>

      <section aria-label="User account statistics" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Accounts"
          value={formatCount(statistics.totalAccounts)}
          Icon={Users}
          tone="neutral"
          loading={loadingStatistics || Boolean(statisticsError)}
        />
        <StatCard
          title="Active Accounts"
          value={formatCount(statistics.activeAccounts)}
          Icon={UserCheck}
          tone="green"
          loading={loadingStatistics || Boolean(statisticsError)}
        />
        <StatCard
          title="Disabled Accounts"
          value={formatCount(statistics.disabledAccounts)}
          Icon={UserX}
          tone="red"
          loading={loadingStatistics || Boolean(statisticsError)}
        />
        <StatCard
          title="New This Week"
          value={`+${formatCount(statistics.newAccountsThisWeek)}`}
          Icon={UserPlus}
          tone="blue"
          loading={loadingStatistics || Boolean(statisticsError)}
        />
      </section>

      {statisticsError && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <span className="inline-flex items-center gap-2">
            <AlertCircle aria-hidden="true" size={17} />
            {statisticsError}
          </span>
          <button
            type="button"
            onClick={() => setStatisticsRefreshKey((current) => current + 1)}
            className="font-semibold underline underline-offset-2"
          >
            Retry
          </button>
        </div>
      )}

      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-gray-100 p-4 sm:p-5 xl:flex-row xl:items-center xl:justify-between">
          <label className="relative block w-full xl:max-w-md">
            <Search
              aria-hidden="true"
              size={17}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name, username or email"
              className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-3 text-sm text-gray-800 outline-none transition focus:border-chaybook-primary focus:bg-white focus:ring-2 focus:ring-chaybook-primary/10"
            />
          </label>

          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-gray-50 px-3 py-2 text-xs font-medium text-gray-600">
              <Activity aria-hidden="true" size={14} />
              {formatCount(totalElements)} accounts
            </span>
            <label className="sr-only" htmlFor="user-status-filter">
              Filter by status
            </label>
            <select
              id="user-status-filter"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-chaybook-primary focus:ring-2 focus:ring-chaybook-primary/10"
            >
              <option value="ALL">All statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="DISABLED">Disabled</option>
            </select>
          </div>
          <p className="text-xs text-gray-400 xl:sr-only">
            Search and status filter apply to the current page.
          </p>
        </div>

        {actionError && (
          <div
            role="alert"
            className="flex items-center gap-2 border-b border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700 sm:px-5"
          >
            <AlertCircle aria-hidden="true" size={17} />
            {actionError}
          </div>
        )}

        <div className="min-w-0 overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse text-left">
            <thead className="bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500">
              <tr>
                <th scope="col" className="px-5 py-3.5">User</th>
                <th scope="col" className="px-5 py-3.5">Email Address</th>
                <th scope="col" className="px-5 py-3.5">Full Name</th>
                <th scope="col" className="px-5 py-3.5">Joined Date</th>
                <th scope="col" className="px-5 py-3.5">Status</th>
                <th scope="col" className="px-5 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {loadingUsers && users.length === 0 ? (
                Array.from({ length: 5 }, (_, index) => (
                  <tr key={`skeleton-${index}`} aria-hidden="true">
                    {Array.from({ length: 6 }, (_, cellIndex) => (
                      <td key={cellIndex} className="px-5 py-4">
                        <span className="block h-4 w-24 animate-pulse rounded bg-gray-100" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : error ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center">
                    <div className="mx-auto flex max-w-sm flex-col items-center">
                      <AlertCircle aria-hidden="true" size={24} className="text-red-500" />
                      <p className="mt-2 font-semibold text-gray-800">Unable to load users.</p>
                      <button
                        type="button"
                        onClick={() => setRefreshKey((current) => current + 1)}
                        className="mt-3 inline-flex items-center gap-2 rounded-lg bg-chaybook-primary px-3 py-2 text-sm font-semibold text-white hover:bg-chaybook-hover"
                      >
                        <RefreshCw aria-hidden="true" size={15} />
                        Retry
                      </button>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-sm text-gray-500">
                    {users.length === 0
                      ? "No users found."
                      : "No users match the current search or status filter on this page."}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const isActive = user.status?.toUpperCase() === "ACTIVE";
                  const isUpdating = updatingUserId === user.userId;

                  return (
                    <tr key={user.userId} className="transition-colors hover:bg-gray-50/80">
                      <td className="px-5 py-3.5">
                        <div className="flex min-w-[160px] items-center gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-xs font-bold text-chaybook-primary ring-1 ring-emerald-100">
                            {getInitials(user)}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-gray-900">{user.username || "—"}</p>
                            <p className="text-xs text-gray-400">ID {user.userId}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-gray-600">{user.email || "—"}</td>
                      <td className="px-5 py-3.5 text-gray-700">{user.fullName || "—"}</td>
                      <td className="whitespace-nowrap px-5 py-3.5 text-gray-500">
                        <span className="inline-flex items-center gap-2">
                          <CalendarDays aria-hidden="true" size={15} className="text-gray-400" />
                          {formatJoinedDate(user.createdAt)}
                        </span>
                      </td>
                      <td className="px-5 py-3.5"><StatusBadge status={user.status} /></td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(user)}
                          disabled={updatingUserId !== null}
                          aria-label={`${isActive ? "Deactivate" : "Activate"} ${user.username || "user"}`}
                          className={`inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-xs font-semibold transition-colors disabled:cursor-wait disabled:opacity-60 ${
                            isActive
                              ? "bg-red-50 text-red-700 hover:bg-red-100"
                              : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                          }`}
                        >
                          {isUpdating ? (
                            <LoaderCircle aria-hidden="true" size={14} className="animate-spin" />
                          ) : isActive ? (
                            <Ban aria-hidden="true" size={14} />
                          ) : (
                            <Check aria-hidden="true" size={14} />
                          )}
                          {isActive ? "Deactivate" : "Activate"}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t border-gray-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <p className="text-xs text-gray-500" aria-live="polite">
            {hasLocalFilter
              ? `Showing ${filteredUsers.length} matching users on this page · ${formatCount(totalElements)} total accounts`
              : `Showing ${formatCount(firstAccount)} to ${formatCount(lastAccount)} of ${formatCount(totalElements)} accounts`}
          </p>

          <nav aria-label="User list pages" className="flex items-center gap-1 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(0, current - 1))}
              disabled={page === 0 || loadingUsers}
              className="inline-flex h-9 items-center gap-1 rounded-lg px-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-300"
            >
              <ChevronLeft aria-hidden="true" size={16} />
              <span className="hidden sm:inline">Prev</span>
            </button>

            {pageItems.map((item) =>
              typeof item === "string" ? (
                <span key={item} className="px-1 text-sm text-gray-400">…</span>
              ) : (
                <button
                  key={item}
                  type="button"
                  onClick={() => setPage(item)}
                  disabled={loadingUsers}
                  aria-current={page === item ? "page" : undefined}
                  aria-label={`Page ${item + 1}`}
                  className={`h-9 min-w-9 rounded-lg px-2 text-sm font-semibold transition-colors ${
                    page === item
                      ? "bg-chaybook-primary text-white shadow-sm"
                      : "text-gray-600 hover:bg-gray-100"
                  } disabled:cursor-wait`}
                >
                  {item + 1}
                </button>
              ),
            )}

            <button
              type="button"
              onClick={() => setPage((current) => Math.min(totalPages - 1, current + 1))}
              disabled={page >= totalPages - 1 || loadingUsers}
              className="inline-flex h-9 items-center gap-1 rounded-lg px-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-300"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight aria-hidden="true" size={16} />
            </button>
          </nav>
        </div>

        <p className="px-4 pb-4 text-[11px] text-gray-400 sm:px-5 xl:hidden">
          Search and status filter apply to the current page. Pagination is loaded from the server.
        </p>
      </section>
    </div>
  );
}

export default UserManagementPage;
