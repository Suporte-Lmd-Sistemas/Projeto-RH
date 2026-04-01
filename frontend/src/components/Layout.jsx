export default function Layout({ title, children }) {
  return (
    <div style={styles.page}>
      <aside style={styles.sidebar}>
        <div style={styles.logoArea}>
          <h2 style={styles.logoText}>RH App</h2>
          <p style={styles.logoSubtext}>ERP / Gestão de Pessoas</p>
        </div>

        <nav style={styles.nav}>
          <div style={styles.navItemActive}>Funcionários</div>
          <div style={styles.navItem}>Cargos</div>
          <div style={styles.navItem}>Setores</div>
          <div style={styles.navItem}>Folha</div>
        </nav>
      </aside>

      <main style={styles.main}>
        <header style={styles.header}>
          <h1 style={styles.title}>{title}</h1>
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
    backgroundColor: "#f4f6f8",
  },
  sidebar: {
    width: "240px",
    backgroundColor: "#0f172a",
    color: "#ffffff",
    padding: "24px 16px",
    display: "flex",
    flexDirection: "column",
  },
  logoArea: {
    marginBottom: "32px",
    borderBottom: "1px solid rgba(255,255,255,0.12)",
    paddingBottom: "16px",
  },
  logoText: {
    fontSize: "24px",
    marginBottom: "6px",
  },
  logoSubtext: {
    fontSize: "13px",
    color: "#94a3b8",
  },
  nav: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  navItem: {
    padding: "12px 14px",
    borderRadius: "8px",
    color: "#d1d5db",
    backgroundColor: "transparent",
  },
  navItemActive: {
    padding: "12px 14px",
    borderRadius: "8px",
    color: "#ffffff",
    backgroundColor: "#2563eb",
    fontWeight: "bold",
  },
  main: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
  },
  header: {
    padding: "24px 32px 0 32px",
  },
  title: {
    fontSize: "28px",
    fontWeight: "bold",
    color: "#0f172a",
  },
  content: {
    padding: "24px 32px 32px 32px",
  },
};