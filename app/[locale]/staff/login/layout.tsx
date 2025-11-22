// Separate layout for login page to avoid auth check redirect loop
export default function StaffLoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

