export default function Layout({ title, children }) {
  return (
    <div style={styles.page}>
      <aside style={styles.sidebar}>
        <div style={styles.logoArea}>
          <div style={styles.logoRow}>
            <div style={styles.logoBadge}>LMD</div>
            <div>
              <h2 style={styles.logoText}>SISTEMAS</h2>
            </div>
          </div>
        </div>

        <nav style={styles.nav}>
          <div style={styles.navItem}>Dashboard</div>
          <div style={styles.navItem}>Inbox</div>
          <div style={styles.navItem}>Calendario</div>
          <div style={styles.navItemActive}>Funcionarios</div>
          <div style={styles.navItem}>Performance</div>
          <div style={styles.navItem}>Pagamentos</div>
          <div style={styles.navItem}>Cargos e Departamentos</div>
          <div style={styles.navItem}>Recrutamento</div>
        </nav>
      </aside>

      <main style={styles.main}>
        <header style={styles.header}>
          <div>
            <h1 style={styles.title}>{title}</h1>
            <p style={styles.breadcrumb}>Dashboard / Funcionários</p>
          </div>

          <div style={styles.userArea}>
            <div style={styles.iconButton}>⚙</div>
            <div style={styles.iconButton}>🔔</div>

            <div style={styles.userInfo}>
              <div style={styles.userAvatar}></div>
              <div>
                <div style={styles.userName}>USUARIO</div>
                <div style={styles.userSubtext}>User</div>
              </div>
            </div>
          </div>
        </header>

        <section style={styles.content}>{children}</section>
      </main>
    </div>
  );
}

const styles = {
  page: {
    display: "flex",
    minHeight: "100vh",
    backgroundColor: "#f3f4f6",
    fontFamily: "Arial, sans-serif",
  },

  sidebar: {
    width: "240px",
    backgroundColor: "#ffffff",
    borderRight: "1px solid #e5e7eb",
    padding: "24px 18px",
    display: "flex",
    flexDirection: "column",
    boxSizing: "border-box",
  },

  logoArea: {
    marginBottom: "28px",
  },

  logoRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },

  logoBadge: {
    width: "60px",
    height: "28px",
    borderRadius: "8px",
    backgroundColor: "#1d4ed8",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "bold",
    fontSize: "14px",
  },

  logoText: {
    margin: 0,
    fontSize: "20px",
    fontWeight: "700",
    color: "#374151",
    letterSpacing: "0.5px",
  },

  nav: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    marginTop: "18px",
  },

  navItem: {
    padding: "14px 16px",
    borderRadius: "12px",
    color: "#6b7280",
    backgroundColor: "transparent",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "default",
  },

  navItemActive: {
    padding: "14px 16px",
    borderRadius: "12px",
    color: "#ffffff",
    backgroundColor: "#4da3ff",
    fontSize: "14px",
    fontWeight: "700",
    boxShadow: "0 8px 18px rgba(77, 163, 255, 0.25)",
    cursor: "default",
  },

  main: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    minWidth: 0,
  },

  header: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    padding: "24px 32px 0 32px",
    gap: "20px",
  },

  title: {
    margin: 0,
    fontSize: "32px",
    fontWeight: "700",
    color: "#1f2937",
    lineHeight: 1.2,
  },

  breadcrumb: {
    margin: "6px 0 0 0",
    fontSize: "13px",
    color: "#6b7280",
  },

  userArea: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    flexWrap: "wrap",
    justifyContent: "flex-end",
  },

  iconButton: {
    width: "34px",
    height: "34px",
    borderRadius: "10px",
    backgroundColor: "#dbeafe",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "14px",
    color: "#2563eb",
  },

  userInfo: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginLeft: "8px",
  },

  userAvatar: {
    width: "34px",
    height: "34px",
    borderRadius: "999px",
    backgroundColor: "#bfdbfe",
  },

  userName: {
    fontSize: "12px",
    fontWeight: "700",
    color: "#374151",
    textTransform: "uppercase",
    lineHeight: 1.2,
  },

  userSubtext: {
    fontSize: "12px",
    color: "#9ca3af",
    lineHeight: 1.2,
  },

  content: {
    padding: "24px 32px 32px 32px",
    boxSizing: "border-box",
  },
};