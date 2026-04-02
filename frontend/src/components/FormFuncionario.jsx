import { useEffect, useState } from "react";

const estadoInicial = {
  nome: "",
  cpf: "",
  cargo_oficial: "",
  status: "",
  departamento_id: "",
  cargo_id: "",
};

function aplicarMascaraCPF(valor) {
  const numeros = String(valor).replace(/\D/g, "").slice(0, 11);

  if (numeros.length <= 3) return numeros;
  if (numeros.length <= 6) return `${numeros.slice(0, 3)}.${numeros.slice(3)}`;
  if (numeros.length <= 9) {
    return `${numeros.slice(0, 3)}.${numeros.slice(3, 6)}.${numeros.slice(6)}`;
  }

  return `${numeros.slice(0, 3)}.${numeros.slice(3, 6)}.${numeros.slice(
    6,
    9
  )}-${numeros.slice(9, 11)}`;
}

export default function FormFuncionario({
  onCancelar,
  onSalvar,
  funcionarioEdicao,
  setores = [],
  cargos = [],
}) {
  const [form, setForm] = useState(estadoInicial);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (funcionarioEdicao) {
      setForm({
        nome: funcionarioEdicao.nome || "",
        cpf: funcionarioEdicao.cpf || "",
        cargo_oficial: funcionarioEdicao.cargo_oficial || "",
        status: funcionarioEdicao.status || "",
        departamento_id: funcionarioEdicao.departamento_id ?? "",
        cargo_id: funcionarioEdicao.cargo_rh_id ?? "",
      });
    } else {
      setForm(estadoInicial);
    }
  }, [funcionarioEdicao]);

  function handleChange(e) {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!String(form.departamento_id).trim()) {
      alert("Selecione o setor.");
      return;
    }

    try {
      setSaving(true);

      await onSalvar({
        departamento_id: Number(form.departamento_id),
        cargo_id: String(form.cargo_id).trim()
          ? Number(form.cargo_id)
          : null,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <h2 style={styles.title}>Editar Funcionário</h2>
        <p style={styles.subtitle}>
          Os dados pessoais vêm do ERP. No RH você pode ajustar cargo interno e
          setor.
        </p>
      </div>

      <form onSubmit={handleSubmit} style={styles.form}>
        {/* DADOS DO ERP */}
        <div style={styles.section}>
          <div style={styles.sectionTitle}>Dados do ERP</div>

          <div style={styles.grid}>
            <div style={styles.fieldFull}>
              <label style={styles.label}>Nome</label>
              <input
                type="text"
                name="nome"
                value={form.nome}
                style={styles.inputDisabled}
                disabled
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>CPF</label>
              <input
                type="text"
                name="cpf"
                value={aplicarMascaraCPF(form.cpf)}
                style={styles.inputDisabled}
                disabled
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Status ERP</label>
              <input
                type="text"
                name="status"
                value={form.status || ""}
                style={styles.inputDisabled}
                disabled
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Cargo Oficial ERP</label>
              <input
                type="text"
                name="cargo_oficial"
                value={form.cargo_oficial || ""}
                style={styles.inputDisabled}
                disabled
              />
            </div>
          </div>
        </div>

        {/* DADOS DO RH */}
        <div style={styles.section}>
          <div style={styles.sectionTitle}>Vínculo no RH</div>

          <div style={styles.grid}>
            <div style={styles.field}>
              <label style={styles.label}>Cargo RH</label>

              <select
                name="cargo_id"
                value={form.cargo_id}
                onChange={handleChange}
                style={styles.input}
              >
                <option value="">Sem cargo RH</option>

                {cargos.map((cargo, index) => (
                  <option
                    key={cargo.id ?? cargo.value ?? index}
                    value={cargo.id ?? ""}
                  >
                    {cargo.nome}
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Setor (Departamento RH)</label>

              <select
                name="departamento_id"
                value={form.departamento_id}
                onChange={handleChange}
                style={styles.input}
              >
                <option value="">Selecione um setor</option>

                {setores.map((setor, index) => (
                  <option
                    key={setor.id ?? setor.value ?? index}
                    value={setor.id ?? ""}
                  >
                    {setor.nome}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div style={styles.actions}>
          <button type="button" onClick={onCancelar} style={styles.cancelButton}>
            Voltar
          </button>

          <button type="submit" disabled={saving} style={styles.saveButton}>
            {saving ? "Salvando..." : "Salvar Alterações"}
          </button>
        </div>
      </form>
    </div>
  );
}

const styles = {
  card: {
    backgroundColor: "#ffffff",
    borderRadius: "18px",
    padding: "28px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.06)",
    border: "1px solid #e5e7eb",
  },

  header: {
    marginBottom: "28px",
  },

  title: {
    fontSize: "24px",
    marginBottom: "6px",
    color: "#111827",
    fontWeight: "700",
  },

  subtitle: {
    fontSize: "14px",
    color: "#6b7280",
  },

  form: {
    display: "flex",
    flexDirection: "column",
    gap: "28px",
  },

  section: {
    border: "1px solid #f1f5f9",
    borderRadius: "14px",
    padding: "20px",
  },

  sectionTitle: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#374151",
    marginBottom: "16px",
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: "18px",
  },

  field: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },

  fieldFull: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    gridColumn: "1 / -1",
  },

  label: {
    fontSize: "13px",
    fontWeight: "700",
    color: "#374151",
  },

  input: {
    padding: "12px 14px",
    border: "1px solid #d1d5db",
    borderRadius: "10px",
    outline: "none",
    backgroundColor: "#fff",
  },

  inputDisabled: {
    padding: "12px 14px",
    border: "1px solid #e5e7eb",
    borderRadius: "10px",
    backgroundColor: "#f3f4f6",
    color: "#6b7280",
  },

  actions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "12px",
    flexWrap: "wrap",
  },

  cancelButton: {
    padding: "12px 18px",
    border: "1px solid #d1d5db",
    borderRadius: "10px",
    backgroundColor: "#ffffff",
    color: "#374151",
    fontWeight: "700",
    cursor: "pointer",
  },

  saveButton: {
    padding: "12px 20px",
    border: "none",
    borderRadius: "10px",
    backgroundColor: "#60a5fa",
    color: "#ffffff",
    fontWeight: "700",
    cursor: "pointer",
  },
};