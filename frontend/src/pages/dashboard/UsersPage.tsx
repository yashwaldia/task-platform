// frontend/src/pages/dashboard/UsersPage.tsx
import { useUsers } from '../../hooks/useUsers';
import UserTable from '../../components/users/UserTable';

const UsersPage = () => {
  // Shared cache — UserTable calls useUsers internally with same key, no duplicate request
  const { pagination } = useUsers({ page: 1, limit: 20 });

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Users</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          {pagination
            ? `${pagination.total} member${pagination.total !== 1 ? 's' : ''} total`
            : 'Manage your team members and their roles'}
        </p>
      </div>

      <UserTable />
    </div>
  );
};

export default UsersPage;
