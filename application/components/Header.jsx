// Header.jsx
export default function Header({ role }) {
  const isPatient = role === "patient";
  const isDoctor = role === "doctor";

  return (
    <header style={styles.header}>
      <div style={styles.container}>
        <nav style={styles.nav}>
          <div style={styles.logo}>MeasureWise</div>

          <ul style={styles.navList}>
            {isPatient && (
              <>
                <li><a style={styles.link} href="/dashboard">Dashboard</a></li>
                <li><a style={styles.link} href="/upload">Upload</a></li>
                <li><a style={styles.link} href="/results">Results</a></li>
                <li><a style={styles.link} href="/profile">Profile</a></li>
              </>
            )}

            {isDoctor && (
              <>
                <li><a style={styles.link} href="/doctor-dashboard">Patients</a></li>
                <li><a style={styles.link} href="/review">Reviews</a></li>
                <li><a style={styles.link} href="/analytics">Analytics</a></li>
                <li><a style={styles.link} href="/doctor-profile">Profile</a></li>
              </>
            )}

            <li><a style={styles.link} href="/logout">Logout</a></li>
          </ul>
        </nav>
      </div>
    </header>
  );
}

const styles = {
  header: {
    background: "white",
    borderBottom: "1px solid #e0e0e0",
    padding: "15px 0",
  },
  container: {
    width: "90%",
    maxWidth: "1100px",
    margin: "auto",
  },
  nav: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  logo: {
    fontSize: "1.4em",
    fontWeight: "bold",
    color: "#4a90e2",
  },
  navList: {
    display: "flex",
    gap: "20px",
    listStyle: "none",
    margin: 0,
    padding: 0,
  },
  link: {
    textDecoration: "none",
    color: "#222",
    fontSize: "1em",
  },
};
