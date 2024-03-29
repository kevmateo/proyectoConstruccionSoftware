import { useState, useEffect, useCallback } from 'react';
import './App.css';
import Acciones from './componentes/acciones';
import Acciones2 from './componentes/accionesVista2';
import PanelControl from './componentes/panelControl';
import Button from 'react-bootstrap/esm/Button';
import AgregarAccion from './componentes/agregarAccion';
import Swal from 'sweetalert2'

const socket = new WebSocket('ws://26.240.184.51:8081/');

function App(props) {

  const [acciones, setAcciones] = useState([]);
  const [accionesAuxiliares, setAccionesAuxiliares] = useState([]);
  const [filtroNombre, setFiltroNombre] = useState('');
  const [mostrarAgregarAccion, setMostrarAgregarAccion] = useState(false);
  const [vistaTabla, setVistaTabla] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [modeEliminar, setModeEliminar] = useState(false);
  const [accionesSeleccionadas, setAccionesSeleccionadas] = useState([]);
  const [filaSeleccionada, setFilaSeleccionada] = useState([]);

  const handlerTraerAcciones = () => {
    fetch('http://26.240.184.51:3000/api/v1/acciones', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
    })
      .then((response) => {
        if (response.ok) {
          return response.json();
        } else {
          console.log('Error al traer las acciones');
        }
      })
      .then((data) => {
        data.sort((a, b) => b.id_accion - a.id_accion);
        setAcciones(data);
        setAccionesAuxiliares(data);

      })
      .catch((error) => {
        console.log(error);
      });
  }

  useEffect(() => {
    handlerTraerAcciones();
  }, []);

  const handlerEliminarAcciones = () => {
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        let datos;
        if (accionesSeleccionadas.length > 0) {
          datos = {
            ids: accionesSeleccionadas
          };
        } else {
          datos = {
            ids: filaSeleccionada
          };
        }

        fetch(`http://26.240.184.51:3000/api/v1/acciones`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(datos),
        })
          .then((response) => {
            if (response.ok) {
              console.log('Accion eliminada');
              handlerTraerAcciones();
              setAccionesSeleccionadas([]);
              setFilaSeleccionada([]);
              setModeEliminar(false);
            } else {
              console.log('Error al eliminar la accion');
              console.log(datos);
            }
          });
      }
    });
  };

  const handlerBuscarAcciones = (e) => {
    const texto = e.target.value;
    setFiltroNombre(texto);
    const cleanText = texto.trim();

    const accionesFiltradas = acciones.filter((accion) => accion.siglas_accion.toLowerCase().includes(cleanText.toLowerCase()));
    setAccionesAuxiliares(accionesFiltradas);
  }

  const handlerAbrirAgregarAccion = () => {
    setMostrarAgregarAccion(true);
  }

  const hanlderCerrarAgregarAccion = () => {
    setMostrarAgregarAccion(false);
    //sendMessage(JSON.stringify({ type: 'agregar_accion' }));
  }

  const handlerCambiarVista = () => {
    setVistaTabla(!vistaTabla);
  }

  const handlerToggleDarkMode = () => {
    setDarkMode(!darkMode);
    const body = document.body;
    if (darkMode) {
      body.classList.remove('dark-theme');
    } else {
      body.classList.add('dark-theme');
    }
  }

  const handlerModoEliminar = () => {
    setModeEliminar(!modeEliminar);
    setAccionesSeleccionadas([]);
    console.log("modo eliminar puesto");
  }

  const handlerSeleccionarAccion = (id_accion) => {
    if (modeEliminar) {
      const nuevasAccionesSeleccionadas = accionesSeleccionadas.includes(id_accion)
        ? accionesSeleccionadas.filter((accion) => accion !== id_accion)
        : [...accionesSeleccionadas, id_accion];
      setAccionesSeleccionadas(nuevasAccionesSeleccionadas);
    }
  }

  const handlerFilaSeleccionada = (id_accion) => {
    if (modeEliminar) {
      setFilaSeleccionada(prevFilasSeleccionadas => {
        let nuevasFilasSeleccionadas;

        if (typeof id_accion === 'number') {
          nuevasFilasSeleccionadas = prevFilasSeleccionadas.includes(id_accion)
            ? prevFilasSeleccionadas.filter((fila) => fila !== id_accion)
            : [...prevFilasSeleccionadas, id_accion];
        } else {
          nuevasFilasSeleccionadas = id_accion;
        }
        return nuevasFilasSeleccionadas;
      });
    }
  };

  const hanlderEventoWebSocket = () => {
    socket.addEventListener('message', function (event) {
      const messageData = JSON.parse(event.data);
      setAcciones(acciones => acciones.map(accion => {
        if (accion.id_accion === messageData.id_accion) {
          return {
            ...accion,
            cambio: messageData.cambio,
            ganancia_perdida: messageData.ganancia_perdida
          };
        }
        
        return accion;
      }));
    });
  }

  useEffect(() => {
    hanlderEventoWebSocket();
  }, []);


  return (
    <>
      <header>
        <PanelControl
          handlerBuscarAcciones={handlerBuscarAcciones}
          handlerCambiarVista={handlerCambiarVista}
          vistaTabla={vistaTabla}
          toggleDarkMode={handlerToggleDarkMode}
          darkMode={darkMode}
        />
      </header>
      <div
        className="contenedor-botones"
        style={{ opacity: modeEliminar ? '0' : '1', display: modeEliminar ? 'none' : 'flex' }}
      >
        <Button variant="success" onClick={handlerAbrirAgregarAccion} darkMode={darkMode} >Agregar Acción</Button>
        <Button variant='danger' darkMode={darkMode} onClick={handlerModoEliminar} >Eliminar Acción</Button>
      </div>
      <div className="contenedor-avisos"
        style={{ opacity: modeEliminar ? '1' : '0', display: modeEliminar ? 'flex' : 'none' }}
      >
        <p style={{ color: '#DF3444', margin: '.5rem 0 0 0' }}>Seleccione la acción que desea eliminar</p>
        <div className="contenedor-avisos-botones">
          <Button variant='danger' darkMode={darkMode} onClick={handlerEliminarAcciones} >Eliminar Acción</Button>
          <Button variant='secondary' darkMode={darkMode} onClick={handlerModoEliminar} >Cancelar</Button>
        </div>
      </div>
      <div className="contenedor-acciones" >
        {mostrarAgregarAccion && (
          <div className='overlay'>
            <AgregarAccion
              hanlderCerrarAgregarAccion={hanlderCerrarAgregarAccion}
              handlerTraerAcciones={handlerTraerAcciones}
              darkMode={darkMode}
            />
          </div>
        )}
        {vistaTabla ? (
          accionesAuxiliares.map((accion, index) => (
            <Acciones
              key={index}
              id_accion={accion.id_accion}
              nombreAccion={accion.siglas_accion}
              fechaCompra={accion.fecha_compra}
              precioCompraAccion={accion.precio_compra}
              cantidadAccion={accion.cantidad_acciones}
              precioAccion={accion.costo_total}
              cambio={accion.cambio}
              ganancia_perdidas={accion.ganancia_perdida}
              darkMode={darkMode}
              handlerModoEliminar={handlerModoEliminar}
              modeEliminar={modeEliminar}
              handlerSeleccionarAccion={() => handlerSeleccionarAccion(accion.id_accion)}
            />
          ))
        ) : (
          <Acciones2
            acciones={accionesAuxiliares}
            darkMode={darkMode}
            handlerModoEliminar={handlerModoEliminar}
            modeEliminar={modeEliminar}
            handlerFilaSeleccionada={handlerFilaSeleccionada}
            filaSeleccionada={filaSeleccionada}
            setFilaSeleccionada={setFilaSeleccionada}
          />
        )}
      </div>
    </>
  );
}

export default App;
