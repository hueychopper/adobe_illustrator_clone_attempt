import React from 'react';
import './style/ill.css';
import Alligator from "./images/alligator.jpg";
import Navbar from "./Navbar";
import * as htmlToImage from "html-to-image";
import * as html2canvas from "html2canvas";
import { Dropdown, Form, Row } from "react-bootstrap";
import { Link } from "react-router-dom";
import { useGesture } from "react-use-gesture";
import alligator from "./images/alligator.jpg";
import PinchZoomPan from "react-responsive-pinch-zoom-pan";
import { Stage, Layer, Image, Rect, Text, Circle, Transformer } from "react-konva";
import DisplayImage from './DisplayImage';
// import DrawRect from "./DrawRect";
//icons
import { FaMousePointer } from 'react-icons/fa';
import { FiMousePointer } from 'react-icons/fi';
import { ImMagicWand } from 'react-icons/im';
import { FaPenNib } from 'react-icons/fa';
import { BiText } from 'react-icons/bi';
import { BiRectangle } from 'react-icons/bi';
import { GiMagnifyingGlass } from 'react-icons/gi';
import { MdGradient } from 'react-icons/md';
import { AiOutlineLine } from 'react-icons/ai';
import { IoEllipseOutline } from 'react-icons/io5';
import { BiSquareRounded } from 'react-icons/bi';
import { BsArrowsMove } from "react-icons/bs";
import { FcImport } from "react-icons/fc";
import { FcSimCard } from 'react-icons/fc';
import { AiOutlineCaretDown } from "react-icons/ai";
import { FcDeleteRow } from "react-icons/fc";
import { connect } from 'react-redux';
import { fetchUser, fetchUserDocuments } from "../redux/actions/actions";
import firebase from "../firebase-config";
require("firebase/firestore");
require("firebase/firebase-storage");

class Illustrator extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            options: false,
            menu: false,
            file: null,
            fileName: null,
            screenshotURL: null,
            moveTool: false,
            dr_images: [],
            currentTool: null,
            shape: [],
            newShape: [],
        }
        this.stageRef = React.createRef(null);
        this.op = this.op.bind(this);
        this.panTool = this.panTool.bind(this);
        this.updateCanvas = this.updateCanvas.bind(this);
        this.onCapture = this.onCapture.bind(this);
        // this.say = this.say.bind(this);
    }
    toggle = () => {this.setState({menu: !this.state.menu})}

    op = () => {
        this.setState({
            options: !this.state.options
        })
    }

    panTool = () => {
      this.setState({
        moveTool: !this.state.moveTool,
      })
    }

    fileChange = (event) => {
      const {screenshotURL} = this.state;
      const canvas = document.getElementById("canvas");
      //console.log(this.state.screenshotURL)
      const file = event.target.files[0];
      const storageRef = firebase.storage().ref().child(`documentImages/${firebase.auth().currentUser.uid}/${this.props.location.state.id}/${file.name}`)
      const task = storageRef.put(file)
      task.then(() => {console.log("File uploaded: ", file.name)})
      this.setState({
        file: URL.createObjectURL(file),
        fileName: file.name,
      });
      const progress = (transfer) => {
        console.log(`transferred: ${transfer.bytesTransferred}`)
      }
      const completedTask = () => {
        task.snapshot.ref.getDownloadURL()
        .then((snapshot) => {
          if(this.stageRef.current !== null) {
            var uri = this.stageRef.current.toDataURL();
            saveImageData(snapshot, uri);
          } else {
            saveImageData(snapshot);
          }
          console.log(snapshot);
        })
      }
      const taskError = (error) => {
        console.log(error);
      }
      task.on("state_changed", progress, taskError, completedTask);

      const saveImageData = (downloadURL, dataURL) => {
        dataURL = dataURL || null;
        firebase.firestore()
        .collection("documents")
        .doc(firebase.auth().currentUser.uid)
        .collection("userDocs")
        .doc(this.props.location.state.id)
        .update({
          screenshot: dataURL,
          canvasState: dataURL,
        }).then(() => {
          console.log("Updated");
          firebase.firestore()
          .collection("documents")
          .doc(firebase.auth().currentUser.uid)
          .collection("userDocs")
          .doc(this.props.location.state.id)
          .collection("imports")
          .add({
            img: downloadURL,
            imgWidth: 150,
            imgHeight: 130,
            x: 0,
            y: 0,
          }).then(() => {
            setTimeout(() => {
              window.location.reload()
            }, 1500)
          })
        }).catch(() => console.log("there seems to be an error"))
      }
    }

    onCapture = () => {
      return htmlToImage.toPng(document.getElementById("canvas"))
      .then((dataURL) => {
        return dataURL;
      })
    }

    updateCanvas = () => {
      const docId = this.props.location.state.id;

      firebase.firestore()
      .collection("documents")
      .doc(firebase.auth().currentUser.uid)
      .collection("userDocs")
      .doc(docId)
      .collection("imports")
      .get()
      .then((snapshot) => {
        let cd = snapshot.docs.map(doc => {
          var data = doc.data();
          var id = doc.id;
          return { id, ...data }
        })
        const { dr_images } = this.state;
        this.setState({
          dr_images: [...this.state.dr_images, cd],
        })
      })
      // console.log(this.state.dr_images);
      
    }

    deleteCurrentDocument = () => {
      firebase.firestore()
      .collection("documents")
      .doc(firebase.auth().currentUser.uid)
      .collection("userDocs")
      .doc(this.props.location.state.id)
      .delete()
      .then(() => console.log("deleted"))
    }

    componentDidMount() {
        this.props.fetchUser();
        this.props.fetchUserDocuments();
        this.updateCanvas();
    }

    toolManager = (selectedTool) => {
      this.setState({
        currentTool: selectedTool,
      })
    }

    
    makeOptions = (event) => {
      console.log(event);
    }

    render() {
        const { options, file, dr_images, currentTool, shape, newShape } = this.state;
        console.log(currentTool);
        const handleMD = (ev) => {
          const { x, y } = ev.target.getStage().getPointerPosition();
          if(newShape.length === 0) {
            switch(currentTool) {
              case "rect":
                this.setState({
                  newShape: [{x, y, width: 0, height: 0, key: "0"}],
                })
                break;
              case "ellipse":
                this.setState({
                  newShape: [{x,y,radius:0,key:"0"}]
                })
                break;
            }
            
          }
        }
        const handleMU = (ev) => {
          if(newShape.length === 1) {
            const sx = newShape[0].x;
            const sy = newShape[0].y;
            const { x, y } = ev.target.getStage().getPointerPosition();
            // console.log(newShape);
            switch(currentTool) {
              case "rect":
                const addToShape = {
                  x: sx,
                  y: sy,
                  width: x - sx,
                  height: y - sy,
                  key: shape.length + 1,
                }
                this.setState({
                  shape: [...shape, addToShape],
                  newShape: [],
                })
                break;
              case "ellipse":
                const addToCircle = {
                  x: sx,
                  y: sy,
                  radius: (x) - Math.PI*2,
                  key: shape.length + 1,
                }
                this.setState({
                  shape: [...shape, addToCircle],
                  newShape: [],
                })
                break;
            }
            
            // console.log(this.state.shape); //should be appending new shapes
          }
        }
        const handleMM = (ev) => {
          if(newShape.length === 1) {
            const sx = newShape[0].x;
            const sy = newShape[0].y;
            const { x, y } = ev.target.getStage().getPointerPosition();
            switch(currentTool) {
              case "rect":
                this.setState({
                  newShape: [{
                    x: sx,
                    y: sy,
                    width: x - sx,
                    height: y - sy,
                    key: "0",
                  }]
                });
                break;
              case "ellipse":
                this.setState({
                  newShape: [{x: sx, y: sy, radius: Math.PI*2,key:"0"}],
                });
                break;
            }
          }
        }
        const toDraw = [...shape, ...newShape];

        const logId = (event) => {
          console.log(event.target);
        }

        const scale = 1.01;
        let lastCenter = null;
        let lastDist = 0;
        const stageRef = this.stageRef;
        
        function isTouchEnabled() { 
          return ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (navigator.msMaxTouchPoints > 0); 
        }
        
        function zoomStage(event) {
          console.log(event);
          event.evt.preventDefault();
          if(stageRef !== undefined) {
            if (stageRef.current !== null) {
              const stage = stageRef.current;
              const oldScale = stage.scaleX();
              const { x: pointerX, y: pointerY } = stage.getPointerPosition();
              const mousePointTo = {
                x: (pointerX - stage.x()) / oldScale,
                y: (pointerY - stage.y()) / oldScale,
              };
              const newScale = event.evt.deltaY > 0 ? oldScale * scale : oldScale / scale;
              stage.scale({ x: newScale, y: newScale });
              const newPos = {
                x: pointerX - mousePointTo.x * newScale,
                y: pointerY - mousePointTo.y * newScale,
              }
              stage.position(newPos);
              stage.batchDraw();
            }
          }
        }

        return (
            <div className="Ill">
              {/* <Navbar fileEvent={this.fileChange} currentFile={this.state.file} saveEvent={this.onCapture} ssf={this.state.screenshotURL} /> */}
              <div className="bar">
                <nav>
                  <ul>
                    <button style={{backgroundColor: 'transparent', border: 'none', 
                    padding: '0',
                    zIndex: '1',
                    marginRight: '25px',
                    marginLeft: '15px',
                    position: 'relative',
                    top: '100px',
                    color: '#fff'}} onClick={this.toggle}>File <AiOutlineCaretDown/></button>
                    {this.state.menu ?
                    <div className="dropdn-menu">
                        <label htmlFor="importImage" className="import"><FcImport /> Import
                            <input type="file" id="importImage" onChange={this.fileChange} style={{width: '1px', height: '1px'}} />
                        </label>
                        <div onClick={this.onCapture}><FcSimCard /> Save</div>
                        <div onClick={logId}><FcDeleteRow />Delete selected image</div>
                        <div onClick={this.deleteCurrentDocument}>Delete</div>
                    </div>
                    : null }
                    <Dropdown>
                      <Dropdown.Toggle>Edit</Dropdown.Toggle>
                      <Dropdown.Menu variant="dark">
                        <Dropdown.Item>Name</Dropdown.Item>
                      </Dropdown.Menu>
                    </Dropdown>
                    <Dropdown>
                      <Dropdown.Toggle>Object</Dropdown.Toggle>
                      <Dropdown.Menu variant="dark">
                        <Dropdown.Item>Name</Dropdown.Item>
                      </Dropdown.Menu>
                    </Dropdown>
                    <Dropdown>
                      <Dropdown.Toggle>Type</Dropdown.Toggle>
                      <Dropdown.Menu variant="dark">
                        <Dropdown.Item>Name</Dropdown.Item>
                      </Dropdown.Menu>
                    </Dropdown>
                    <Dropdown>
                      <Dropdown.Toggle>Select</Dropdown.Toggle>
                      <Dropdown.Menu variant="dark">
                        <Dropdown.Item>Name</Dropdown.Item>
                      </Dropdown.Menu>
                    </Dropdown>
                    <Dropdown>
                      <Dropdown.Toggle>Effect</Dropdown.Toggle>
                      <Dropdown.Menu variant="dark">
                        <Dropdown.Item>Name</Dropdown.Item>
                      </Dropdown.Menu>
                    </Dropdown>
                    <Dropdown>
                      <Dropdown.Toggle>View</Dropdown.Toggle>
                      <Dropdown.Menu variant="dark">
                        <Dropdown.Item>Name</Dropdown.Item>
                      </Dropdown.Menu>
                    </Dropdown>
                    <Dropdown>
                      <Dropdown.Toggle>Window</Dropdown.Toggle>
                      <Dropdown.Menu variant="dark">
                        <Dropdown.Item >
                          <Link to="/" style={{color: '#fff', textDecoration: 'none'}}>Home</Link>
                        </Dropdown.Item>
                      </Dropdown.Menu>
                    </Dropdown>
                    <Dropdown>
                      <Dropdown.Toggle>Help</Dropdown.Toggle>
                      <Dropdown.Menu variant="dark">
                        <Dropdown.Item>
                          Home
                        </Dropdown.Item>
                      </Dropdown.Menu>
                    </Dropdown>
                  </ul>
                </nav>
              </div>
                <div className="sidebar">
                  <ul>
                    <li title="Select"><FaMousePointer /></li>
                    <li title="select vertices"><FiMousePointer /></li>
                    <li title="magic wand"><ImMagicWand /></li>
                    <li title="pen tool"><FaPenNib /></li>
                    <li title="text tool"><BiText /></li>
                    <li onClick={() => this.toolManager("rect")} onDoubleClick={this.op} title="rectangle tool (double click for more options/shapes)"><BiRectangle /></li>
                      {options ? 
                      <div className="sidebar-out">
                        <li onClick={() => this.toolManager("ellipse")} className="sp-el" style={{fontSize: 15}}><IoEllipseOutline /> Ellipse</li>
                        <li onClick={() => this.toolManager("rr")} className="sp-rr" style={{fontSize: 15}}><BiSquareRounded /> Rounded Rectangle</li>
                      </div>
                      : null}

                    <li title="gradient tool"><MdGradient /></li>
                    <li title="zoom tool"><GiMagnifyingGlass /></li>
                    <li title="line tool"><AiOutlineLine /></li>
                    <li title="pan/move around" onClick={this.panTool}><BsArrowsMove/></li>
                  </ul>
                      
                </div>
        
              <div className="mainCanvas">
                <div className="tabs"></div>
                  {this.state.moveTool ? 
                    <Stage 
                    style={{backgroundColor: '#fff'}}
                    width={this.props.location.state.width}
                    height={this.props.location.state.height}
                    draggable={!isTouchEnabled()}
                    onWheel={zoomStage}
                    ref={this.stageRef}>
                      <Layer>
                        <Rect x={0} y={50} width={10} height={10} fill="red" />
                      </Layer>
                    </Stage>
                  : 
                    <Stage
                    style={{backgroundColor: '#fff'}}
                    width={this.props.location.state.width}
                    height={this.props.location.state.height}
                    onMouseDown={handleMD}
                    onMouseUp={handleMU}
                    onMouseMove={handleMM}
                    >
                      <Layer>
                        {toDraw.map(value => {
                          switch(currentTool) {
                            case "rect":
                              return (
                                <Rect x={value.x} y={value.y} width={value.width} height={value.height} 
                                fill="red"
                                onContextMenu={this.makeOptions}
                                />
                                // <Transformer>
                                //   <Rect x={value.x} y={value.y} width={value.width} height={value.height} fill="red"/>
                                // </Transformer>
                              );
                            case "ellipse":
                              return (
                                <Circle x={value.x} y={value.y} radius={value.radius} fill="gray" />
                              )
                          }
                        })}
                        {dr_images && dr_images.length !== 0 && dr_images.map((img, index) => (
                          <React.Fragment key={index}>
                            {img.map((image) => (
                              <DisplayImage 
                              src={image.img} 
                              width={image.imgWidth} 
                              height={image.imgHeight}
                              x={image.x}
                              y={image.y}
                              parentId={this.props.location.state.id}
                              currentId={image.id} 
                              fileName={this.state.fileName}
                              onContextMenu={this.makeOptions}
                               />
                            ))}
                          </React.Fragment>
                        ))}
                      </Layer>
                    </Stage>
                  }
                  
                  <img src={this.state.file} id="importedImg" width="100px" height="100px" ref={this.imageRef} />
              </div>
            </div>
        );
    }
}

const mapStateToProps = state => {
  // console.log(state)
  return {
      currentUser: state.user.currentUser,
      userDocs: state.user.userDocs,
      //canvasData: state.user.canvasData,
  }
}
const mapDispatchToProps = dispatch => {
  return {
      fetchUser: () => dispatch(fetchUser()),
      fetchUserDocuments: () => dispatch(fetchUserDocuments()),
      //fetchCanvasData: () => dispatch(fetchCanvasData())
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(Illustrator);