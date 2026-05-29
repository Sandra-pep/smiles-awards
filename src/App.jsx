import { collection, addDoc, getDocs } from "firebase/firestore";
import { db } from "./firebase";
import { useState, useEffect } from "react";

import fondoIntro from "./assets/intro.jpg";
import fondoValores from "./assets/valores.jpg";

import iconraise from "./assets/icon-raise.png";
import iconconsumer from "./assets/icon-consumer.png";
import iconact from "./assets/icon-act.png";
import iconfocus from "./assets/icon-focus.png";
import iconinclude from "./assets/icon-include.png";
import iconcelebrate from "./assets/icon-celebrate.png";
import iconintegrity from "./assets/icon-integrity.png";

function App() {

  const categorias = [
    {
      nombre: "RAISE THE BAR ON TALENT",
      icon: iconraise,
      ganador: "Edgar Cochran",
      personas: [
        { nombre: "Valeria Medina" },
        { nombre: "Edgar Cochran" }
      ]
    },
    {
      nombre: "BE CONSUMER CENTRIC",
      icon: iconconsumer,
      ganador: "Sandra Rodríguez",
      personas: [
        { nombre: "Sergio Ayala" },
        { nombre: "David Martínez" },
        { nombre: "Sandra Rodríguez" },
        { nombre: "Alejandro y Tania" }
      ]
    },
    {
      nombre: "ACT AS OWNERS",
      icon: iconact,
      ganador: "Alex, Dany, André y Tania",
      personas: [
        { nombre: "Alex, Dany, André y Tania" },
        { nombre: "André López" },
        { nombre: "Tania Lara" },
        { nombre: "Noemi Macedo" },
        { nombre: "Aranza Morales" },
        { nombre: "Miriam Islas" }
      ]
    },
    {
      nombre: "ACT WITH INTEGRITY",
      icon: iconintegrity,
      ganador: "Aldo Alvarado",
      personas: [
        { nombre: "Aldo Alvarado" },
        { nombre: "Adriana Gómez" },
        { nombre: "Aranza Morales" },
        { nombre: "Miriam Islas" }
      ]
    },
    {
      nombre: "FOCUS & GET THINGS DONE FAST",
      icon: iconfocus,
      ganador: "Aranza Morales",
      personas: [
        { nombre: "David Rosario" },
        { nombre: "David y Serch" },
        { nombre: "Aranza Morales" },
        { nombre: "Mariana Rojas" },
        { nombre: "Juan Reyes" },
        { nombre: "Sandra Rodríguez" },
        { nombre: "Noemi Macedo" }
      ]
    },
    {
      nombre: "CELEBRATE SUCCESS",
      icon: iconcelebrate,
      ganador: "Sergio Ayala",
      personas: [
        { nombre: "Juan, Tamy y André" },
        { nombre: "Sergio Ayala" },
        { nombre: "Adriana Gómez" }
      ]
    }
  ];

  const finalistas = [
    { nombre: "Mariana Rojas" },
    { nombre: "André López" },
    { nombre: "Tania Lara" }
  ];

  const ganadorFinal = "Tania Lara";

  const [fase, setFase] = useState("login");
  const [usuario, setUsuario] = useState("");
  const [inputUsuario, setInputUsuario] = useState("");
  const [voto, setVoto] = useState(null);
  const [tiempo, setTiempo] = useState(15);
  const [faseResultado, setFaseResultado] = useState(false);
  const [categoriaIndex, setCategoriaIndex] = useState(0);
  const [aciertos, setAciertos] = useState(0);
  const [tiempoTotal, setTiempoTotal] = useState(0);
  const [tiempoVoto, setTiempoVoto] = useState(null);
  const [ranking, setRanking] = useState([]);
  const categoria = categorias[categoriaIndex];

  // ⏱️ temporizador
  useEffect(() => {
    let intervalo;

    if ((fase === "encuesta" || fase === "finalEncuesta") && tiempo > 0) {
      intervalo = setTimeout(() => {
        setTiempo(t => t - 1);
      }, 1000);
    }

    if ((fase === "encuesta" || fase === "finalEncuesta") && tiempo === 0) {
      setTimeout(() => {
        setFaseResultado(true);
      }, 1000);
    }

    return () => clearTimeout(intervalo);
  }, [tiempo, fase]);

  // Calcular ranking desde Firebase
  const calcularRanking = async () => {
    try {
      const snapshot = await getDocs(collection(db, "votos"));
      const votos = snapshot.docs.map(doc => doc.data());

      const todasLasGanancias = [...categorias.map(c => c.ganador), ganadorFinal];

      const porUsuario = {};

      votos.forEach(v => {
        if (!porUsuario[v.usuario]) {
          porUsuario[v.usuario] = { aciertos: 0, tiempoTotal: 0, votos: 0 };
        }
        const esAcierto = todasLasGanancias.includes(v.respuesta);
        porUsuario[v.usuario].aciertos += esAcierto ? 1 : 0;
        porUsuario[v.usuario].tiempoTotal += v.tiempoUsado || 0;
        porUsuario[v.usuario].votos += 1;
      });

      const lista = Object.entries(porUsuario).map(([nombre, datos]) => ({
        nombre,
        aciertos: datos.aciertos,
        tiempoTotal: datos.tiempoTotal
      }));

      // Ordenar: más aciertos primero, menos tiempo desempata
      lista.sort((a, b) =>
        b.aciertos !== a.aciertos
          ? b.aciertos - a.aciertos
          : a.tiempoTotal - b.tiempoTotal
      );

      setRanking(lista);
    } catch (e) {
      console.error("Error cargando ranking:", e);
    }
  };

  const votar = async (nombre) => {
    if (!voto && tiempo > 0) {
      const tiempoUsado = 15 - tiempo;
      setVoto(nombre);
      setTiempoVoto(tiempoUsado);

      const esAcierto =
        fase === "finalEncuesta"
          ? nombre === ganadorFinal
          : nombre === categoria.ganador;

      if (esAcierto) setAciertos(a => a + 1);
      setTiempoTotal(t => t + tiempoUsado);

      try {
        await addDoc(collection(db, "votos"), {
          usuario,
          respuesta: nombre,
          categoria: fase === "finalEncuesta" ? "GRAN FINAL" : categoria.nombre,
          tiempoUsado,
          acierto: esAcierto,
          timestamp: new Date()
        });
      } catch (error) {
        console.error("Error al guardar voto:", error);
      }
    }
  };

  const siguienteCategoria = () => {
    setTiempo(15);
    setVoto(null);
    setFaseResultado(false);
    setTiempoVoto(null);

    if (categoriaIndex < categorias.length - 1) {
      setCategoriaIndex(i => i + 1);
      setFase("encuesta");
    } else {
      setFase("finalEncuesta");
    }
  };

  const estiloBoton = (nombre, ganadorCategoria) => ({
    display: "block",
    width: "100%",
    margin: "10px 0",
    padding: "15px",
    fontSize: "1.1rem",
    borderRadius: "12px",
    border: "none",
    cursor: voto !== null || tiempo === 0 ? "not-allowed" : "pointer",
    backgroundColor:
      voto === nombre ? "#4CAF50"
      : tiempo === 0 && nombre === ganadorCategoria ? "#4CAF50"
      : tiempo === 0 ? "gray"
      : "#DDB057",
    color: "black",
    fontWeight: "bold",
    transition: "all 0.3s"
  });

  return (
    <div style={{
      minHeight: "100vh",
      backgroundImage: `
        linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)),
        url(${fase === "intro" || fase === "login" ? fondoIntro : fondoValores})
      `,
      backgroundSize: "cover",
      backgroundPosition: "center",
      color: "#DDB057",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px",
      fontFamily: "'Segoe UI', sans-serif"
    }}>

      {/* ✅ LOGIN */}
      {fase === "login" && (
        <div style={{ textAlign: "center", maxWidth: "400px", width: "100%" }}>
          <h2 style={{ fontSize: "1.5rem", marginBottom: "8px" }}>
            The Smiles Music Awards
          </h2>
          <h1 style={{ fontSize: "2.5rem", marginBottom: "30px" }}>
            Premios Mayo 2026 🎤
          </h1>
          <p style={{ color: "#EDBD66", marginBottom: "20px" }}>
            Ingresa tu nombre para participar
          </p>
          <input
            type="text"
            placeholder="Tu nombre..."
            value={inputUsuario}
            onChange={e => setInputUsuario(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter" && inputUsuario.trim()) {
                setUsuario(inputUsuario.trim());
                setFase("intro");
              }
            }}
            style={{
              width: "100%",
              padding: "14px",
              fontSize: "1.1rem",
              borderRadius: "12px",
              border: "2px solid #DDB057",
              background: "rgba(0,0,0,0.5)",
              color: "#DDB057",
              marginBottom: "16px",
              textAlign: "center",
              outline: "none",
              boxSizing: "border-box"
            }}
          />
          <button
            onClick={() => {
              if (inputUsuario.trim()) {
                setUsuario(inputUsuario.trim());
                setFase("intro");
              }
            }}
            style={{
              width: "100%",
              padding: "14px",
              fontSize: "1.1rem",
              borderRadius: "12px",
              border: "none",
              backgroundColor: "#DDB057",
              color: "black",
              fontWeight: "bold",
              cursor: "pointer"
            }}
          >
            Entrar 🎶
          </button>
        </div>
      )}

      {/* ✅ INTRO */}
      {fase === "intro" && (
        <div style={{ textAlign: "center" }}>
          <h2 style={{ fontSize: "1.5rem" }}>The Smiles Music Awards</h2>
          <h1 style={{ fontSize: "3rem" }}>Premios Mayo 2026</h1>
          <p style={{ color: "#EDBD66", fontSize: "1.2rem", marginBottom: "10px" }}>
            Hola, <strong>{usuario}</strong> 👋
          </p>
          <button onClick={() => setFase("valores")}>
            Comenzar 🎤
          </button>
        </div>
      )}

      {/* ✅ VALORES */}
      {fase === "valores" && (
        <div style={{ width: "100%", display: "flex", justifyContent: "center" }}>
          <div style={{ width: "1100px", textAlign: "center", marginTop: "60px" }}>
            <h1 style={{ fontSize: "3.5rem" }}>One PepsiCo Way</h1>
            <p style={{ maxWidth: "700px", margin: "0 auto 30px auto", color: "#EDBD66" }}>
              Este día celebramos la excelencia musical y honramos a los artistas que
              han marcado el mes con su creatividad, pasión y talento extraordinario.
            </p>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
              gap: "20px"
            }}>
              {[
                { icon: iconraise,     title: "Raise the bar on talent" },
                { icon: iconconsumer,  title: "Be consumer centric" },
                { icon: iconact,       title: "Act as owners" },
                { icon: iconintegrity, title: "Act with integrity" },
                { icon: iconfocus,     title: "Focus & get things done fast" },
                { icon: iconinclude,   title: "Include every voice" },
                { icon: iconcelebrate, title: "Celebrate success" }
              ].map((item, i) => (
                <div key={i} style={{
                  border: "2px solid #DDB057",
                  borderRadius: "20px",
                  padding: "15px",
                  background: "rgba(0,0,0,0.4)",
                  maxWidth: "300px",
                  margin: "0 auto"
                }}>
                  <img src={item.icon} style={{ width: "55px", marginBottom: "8px" }} />
                  <h3>{item.title}</h3>
                </div>
              ))}
            </div>
            <button onClick={() => setFase("encuesta")} style={{ marginTop: "40px" }}>
              Ir a votar 🗳️
            </button>
          </div>
        </div>
      )}

      {/* ✅ ENCUESTA NORMAL */}
      {fase === "encuesta" && !faseResultado && (
        <div style={{ width: "100%", maxWidth: "500px", margin: "0 auto", textAlign: "center" }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "15px",
            marginBottom: "15px"
          }}>
            <img src={categoria.icon} style={{ width: "55px" }} />
            <h2 style={{ fontSize: "1.8rem", letterSpacing: "2px", margin: 0 }}>
              {categoria.nombre}
            </h2>
          </div>
          <p style={{ fontSize: "1.2rem", color: "#EDBD66", marginBottom: "25px" }}>
            ¿Quién crees que es el ganador? 🏆
          </p>
          <h3 style={{ marginBottom: "20px", fontSize: "2rem" }}>⏱️ {tiempo}</h3>
          {categoria.personas.map((p) => (
            <button
              key={p.nombre}
              onClick={() => votar(p.nombre)}
              disabled={voto !== null || tiempo === 0}
              style={estiloBoton(p.nombre, categoria.ganador)}
            >
              {p.nombre}
            </button>
          ))}
        </div>
      )}

      {/* ✅ ENCUESTA FINAL */}
      {fase === "finalEncuesta" && !faseResultado && (
        <div style={{ width: "100%", maxWidth: "500px", margin: "0 auto", textAlign: "center" }}>
          <h1>🏆 GRAN FINAL</h1>
          <p style={{ marginBottom: "20px", color: "#EDBD66", fontSize: "1.2rem" }}>
            ¿Quién es el ganador absoluto?
          </p>
          <h3 style={{ marginBottom: "20px", fontSize: "2rem" }}>⏱️ {tiempo}</h3>
          {finalistas.map((p) => (
            <button
              key={p.nombre}
              onClick={() => votar(p.nombre)}
              disabled={voto !== null || tiempo === 0}
              style={estiloBoton(p.nombre, ganadorFinal)}
            >
              {p.nombre}
            </button>
          ))}
        </div>
      )}

      {/* ✅ RESULTADO */}
      {faseResultado && fase !== "ranking" && (
        <div style={{
          textAlign: "center",
          background: "rgba(0,0,0,0.7)",
          borderRadius: "24px",
          padding: "40px",
          maxWidth: "500px",
          width: "100%",
          border: "2px solid #DDB057"
        }}>

          {/* Ganador de la categoría */}
          <p style={{ fontSize: "1rem", color: "#EDBD66", marginBottom: "8px", letterSpacing: "2px" }}>
            {fase === "finalEncuesta" ? "GANADOR ABSOLUTO" : categoria.nombre}
          </p>

          <h1 style={{
            fontSize: "3rem",
            margin: "10px 0",
            color: "#DDB057",
            textShadow: "0 0 20px rgba(221,176,87,0.6)"
          }}>
            🏆 {fase === "finalEncuesta" ? ganadorFinal : categoria.ganador}
          </h1>

          {/* Resultado del usuario */}
          <div style={{
            margin: "24px 0",
            padding: "20px",
            borderRadius: "16px",
            background:
              voto === (fase === "finalEncuesta" ? ganadorFinal : categoria.ganador)
                ? "rgba(76,175,80,0.2)"
                : "rgba(255,255,255,0.05)",
            border:
              voto === (fase === "finalEncuesta" ? ganadorFinal : categoria.ganador)
                ? "1px solid #4CAF50"
                : "1px solid rgba(255,255,255,0.1)"
          }}>
            {voto ? (
              <>
                <p style={{ fontSize: "1rem", color: "#EDBD66", marginBottom: "6px" }}>
                  Tu voto
                </p>
                <p style={{ fontSize: "1.8rem", fontWeight: "bold", margin: "0 0 10px 0" }}>
                  {voto}
                </p>
                <p style={{ fontSize: "2rem", margin: 0 }}>
                  {voto === (fase === "finalEncuesta" ? ganadorFinal : categoria.ganador)
                    ? "✅ ¡Adivinaste!"
                    : "❌ No era tu opción"}
                </p>
                <p style={{ fontSize: "1rem", color: "#EDBD66", marginTop: "8px" }}>
                  Respondiste en {tiempoVoto}s
                </p>
              </>
            ) : (
              <p style={{ fontSize: "1.5rem" }}>⏰ Se acabó el tiempo</p>
            )}
          </div>

          {/* Puntaje acumulado */}
          <p style={{ fontSize: "1rem", color: "#EDBD66", marginBottom: "24px" }}>
            Aciertos acumulados: <strong style={{ color: "#DDB057" }}>{aciertos}</strong>
          </p>

          <button
            onClick={async () => {
              if (fase === "finalEncuesta") {
                await calcularRanking();
                setFase("ranking");
              } else {
                siguienteCategoria();
              }
            }}
            style={{
              padding: "14px 32px",
              fontSize: "1.1rem",
              borderRadius: "12px",
              border: "none",
              backgroundColor: "#DDB057",
              color: "black",
              fontWeight: "bold",
              cursor: "pointer"
            }}
          >
            {fase === "finalEncuesta" ? "Ver ranking final 🏅" : "Siguiente categoría ➡️"}
          </button>
        </div>
      )}

      {/* ✅ RANKING FINAL */}
      {fase === "ranking" && (
        <div style={{
          textAlign: "center",
          background: "rgba(0,0,0,0.8)",
          borderRadius: "24px",
          padding: "40px",
          maxWidth: "600px",
          width: "100%",
          border: "2px solid #DDB057"
        }}>
          <h1 style={{ fontSize: "2.5rem", marginBottom: "8px" }}>🏅 Ranking Final</h1>
          <p style={{ color: "#EDBD66", marginBottom: "30px" }}>
            Ganó quien acertó más y respondió más rápido
          </p>

          {ranking.length === 0 ? (
            <p>Cargando resultados...</p>
          ) : (
            ranking.map((r, i) => (
              <div key={r.nombre} style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background:
                  i === 0 ? "rgba(221,176,87,0.2)"
                  : i === 1 ? "rgba(192,192,192,0.15)"
                  : i === 2 ? "rgba(205,127,50,0.15)"
                  : "rgba(255,255,255,0.05)",
                border:
                  i === 0 ? "1px solid #DDB057"
                  : i === 1 ? "1px solid silver"
                  : i === 2 ? "1px solid #cd7f32"
                  : "1px solid rgba(255,255,255,0.1)",
                borderRadius: "12px",
                padding: "14px 20px",
                marginBottom: "12px"
              }}>
                <span style={{ fontSize: "1.8rem" }}>
                  {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`}
                </span>
                <span style={{ fontSize: "1.2rem", fontWeight: "bold", flex: 1, textAlign: "left", marginLeft: "16px" }}>
                  {r.nombre}
                </span>
                <span style={{ color: "#EDBD66", fontSize: "1rem" }}>
                  {r.aciertos} aciertos · {r.tiempoTotal}s
                </span>
              </div>
            ))
          )}
        </div>
      )}

    </div>
  );
}

export default App;
    
