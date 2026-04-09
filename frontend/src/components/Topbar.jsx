function Topbar({ titulo, caminho }) {
  return (
    <div className="topbar">
      <div className="topbar-left">
        <h2>{titulo}</h2>
        <p>{caminho}</p>
      </div>

      <div className="topbar-right">
        <div className="user-badge">USUÁRIO</div>
      </div>
    </div>
  );
}

export default Topbar;