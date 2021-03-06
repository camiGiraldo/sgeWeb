import { AfterViewInit, Component, NgZone, OnInit, ViewChild, ViewEncapsulation} from '@angular/core';
import { routerTransition } from '../../router.animations';
import { DataTableDirective } from 'angular-datatables';
import { Subject } from 'rxjs/Subject';
import {
    Validators,
    FormBuilder,
    ReactiveFormsModule,
    FormControl
} from '@angular/forms';
import {BrowserModule} from '@angular/platform-browser';
import {platformBrowserDynamic} from '@angular/platform-browser-dynamic';
import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';
import { TiposReconocimientosService } from '../../_services/tiposReconocimientosService';
import { ReconocimientosService } from '../../_services/reconocimientosService';
import { Reconocimiento } from './reconocimiento';
import { ReconocimeintoEgresado } from './reconocimiento';
import * as $ from 'jquery';
import { environment } from '../../../environments/environment';

interface TipoReconocimiento {
    idTipoReconocimiento:string;
    nombre:string;
}

interface Egresado{
  idEgresado:string,
  nombres:string,
  apellidos:string
}

@Component({
  selector : 'app-facultades',
  templateUrl: './ges-reconocimiento.component.html',
  encapsulation: ViewEncapsulation.None,
  styleUrls:['./ges-reconocimiento.component.scss'],
  animations: [routerTransition()]
})

export class GesReconocimientoComponent implements OnInit, AfterViewInit{

  @ViewChild(DataTableDirective) dtElement: DataTableDirective;
  @ViewChild('mdlEgresados') public mdlEgresadoReconocimiento:NgbModal;
  @ViewChild('mdlNotification') public modalNotification:NgbModal;


  //vaariables para la tabla
  dtOptions: any;
  dtTrigger: Subject<any> = new Subject();
  cellSelect:any;
  //------------------------

  modalRef:any;
  public url:string;

  //----------------
  //varables para realizar el Buscar
  tipoDocToFind:string ="";
  numeroDocToFind:string ="";


  message = '';
  messageValidation = '';
  closeResult: string;

  //MAPEO DE LOS ATRIBUTOS DEL FORMULARIO A CREAR
  tipoReconocimientoInterface : TipoReconocimiento;
  reconocimiento: Reconocimiento;
  reconoEgresadoModel: ReconocimeintoEgresado;
  lisEgresadosReconocidos: ReconocimeintoEgresado[];
  listTipoRecono: TipoReconocimiento[];
  listEgresado: Egresado[] = [];
  //archivoa cargar
  fileUpload:string|any;


  idEdit:string ='';


  constructor(private zone: NgZone, private modalService: NgbModal,
    private tipoRecService: TiposReconocimientosService, private reconoService: ReconocimientosService){

    this.reconocimiento = new Reconocimiento();
    this.reconoEgresadoModel = new ReconocimeintoEgresado();
    this.idEdit = '';
    this.url = environment.urlServices;
    this.cellSelect = {
      id : ''
    }
    this.message = 'No se ha seleccionado una fila';
    this.getTiposReconocimiento();

   }

   ngAfterViewInit(): void {
    this.dtTrigger.next();

  }

  someClickHandler(info: any): void {
    if(this.cellSelect.id !== info.idReconocimiento){
      this.cellSelect = {
        id : info.idReconocimiento
      }
      this.message =  info.descripcion;
      this.idEdit = info.idReconocimiento;
    }
    else{
      this.cellSelect = {
        id : ''
      }
      this.message = 'no se ha seleccionado una fila';
      this.idEdit = '';
    }


  }

  getTiposReconocimiento(){
    let callBack = this.tipoRecService.getTiposReconocimiento();
    callBack.subscribe(res => {

        let data = res.json();
        let status = data.status;

        if(status == 'OK'){

          this.listTipoRecono = data.data as TipoReconocimiento[];

        }
        else{
          this.openNotification('Error al obtener los tipos de reconocimientos:'+data.message, 'error');

        }
    },
    error=>{

      this.openNotification('Error del servidor: '+error, 'error');
    });

  }


  ngOnInit():void{
    this.dtOptions = {
      ajax: this.url+'getReconocimientos',
      columns: [{
        title: 'ID',
        data: 'idReconocimiento',
        visible: false
      },{
        title: 'Lugar realizacion',
        data: 'lugarRealizacion'
      }, {
        title: 'Descripcion',
        data: 'descripcion'
      },{
        title: 'Fecha de vinculacion',
        data: 'fechaVinculacion'
      }],
      rowCallback:(row: Node, data: any[] | Object, index: number) => {
         const self = this;
         $('td', row).unbind('click');
         $('td', row).bind('click', () => {
           self.someClickHandler(data);
         });
         return row;
      },
      select:{
            style: 'single'
      },
      "language": {
           "url": "//cdn.datatables.net/plug-ins/1.10.16/i18n/Spanish.json"
       }
    };
  }

  open(content, size:string) {


          this.reconocimiento = new Reconocimiento();
          this.modalRef = this.modalService.open(content);
          this.modalRef.result.then((result) => {
            this.closeResult = `Closed with: ${result}`;
          }, (reason) => {
            this.closeResult = `Dismissed ${this.getDismissReason(reason)}`;
          });
  }

  openModalReconoEgresado(){
    if(this.idEdit == '' || this.idEdit == null || this.idEdit == undefined){
      this.openNotification('Se debe seleccionar un elemento de la tabla', 'error');
    }
    else{
      this.getEgresadosRegistrados();
      this.modalRef = this.modalService.open(this.mdlEgresadoReconocimiento,{windowClass: 'bigModal'});

    }

  }
//metodo que lista los egresados registrados al reconocimeinto seleccionado
  getEgresadosRegistrados(){
    let callBack = this.reconoService.getEgresadosRegistrados(this.idEdit);
    callBack.subscribe(res => {
        let data = res.json();
        let status = data.status;

        if(status == 'OK'){
          this.lisEgresadosReconocidos = [];
          this.lisEgresadosReconocidos = data.data as ReconocimeintoEgresado[];

        }
        else{
          this.openNotification('Error al obtener los egresados registrados al reconocimiento:'+data.message, 'error');

        }
    },
    error=>{

      this.openNotification('Error del servidor: '+error, 'error');
    });
  }

  //al dar click en el egresado reconocido Listado
  //traemos su informacion para mostrarla en el formulario de la izquierda
  getInfoEgresadoReconocimiento(idEgresadoRecono:string, nombres:string, apellidos:string){

    let callBack = this.reconoService.getEgresadoReconocimientoById(idEgresadoRecono);
    callBack.subscribe(res => {
        let data = res.json();
        let status = data.status;
        if(status == 'OK'){

          this.reconoEgresadoModel = data.data as ReconocimeintoEgresado;
          this.reconoEgresadoModel.nombreEgresado = nombres;
          this.reconoEgresadoModel.apellidosEgresado= apellidos;
        }
        else{
          this.openNotification('Error al obtener los egresados registrados al reconocimiento:'+data.message, 'error');
        }
    },
    error=>{

      this.openNotification('Error del servidor: '+error, 'error');
    });



  }
  //metodo que registra los egresados al reconocimiento
  registrarEgresadoAlEvento(){
    this.reconoEgresadoModel.idReconocimiento = this.idEdit;
    let callBack = this.reconoService.registrarEgresadoAlEvento(this.reconoEgresadoModel);
    callBack.subscribe(res => {
        let data = res.json();
        let status = data.status;
        if(status == 'OK'){

          debugger
          this.getEgresadosRegistrados();
        }
        else{
          this.openNotification('Error al obtener los egresados registrados al reconocimiento:'+data.message, 'error');
        }
    },
    error=>{

      this.openNotification('Error del servidor: '+error, 'error');
    });

  }
  //metodo que elimina
  eliminarEgresadoDelEvento(idEgresadoRecono:string){
  debugger
    let callBack = this.reconoService.deleteEgresadoReconocimiento(idEgresadoRecono);
    callBack.subscribe(res => {
        let data = res.json();
        let status = data.status;
        if(status == 'OK'){


          this.getEgresadosRegistrados();


        }
        else{
          this.openNotification('Error al obtener los egresados registrados al reconocimiento:'+data.message, 'error');
        }
    },
    error=>{

      this.openNotification('Error del servidor: '+error, 'error');
    });
  }

  cleanEgreRecoForm(){
    this.reconoEgresadoModel = new ReconocimeintoEgresado();
    this.tipoDocToFind = "";
    this.numeroDocToFind ="";
  }

  saveForm(){


    let callBack = this.reconoService.saveReconocimeinto(this.reconocimiento);
    callBack.subscribe(res => {

        let data = res.json();
        let status = data.status;

        if(status == 'OK'){
          this.reconocimiento.idReconocimiento = data.data;
          this.openNotification('Registro exitoso','succes');
        }
        else{
          this.openNotification('Error del servidor al guardar la informacion basica:'+data.message, 'error');

        }
    },
    error=>{

      this.openNotification('Error del servidor: '+error, 'error');
    });
  }

  getReconocimientoById(content){

    if(this.idEdit == '' || this.idEdit == null || this.idEdit == undefined){
      this.openNotification('Se debe seleccionar un elemento de la tabla', 'error');
    }
    else{

        let callBack = this.reconoService.getReconocimientoById(this.idEdit);
        callBack.subscribe(res => {

            let data = res.json();
            let status = data.status;

            if(status == 'OK'){
              this.reconocimiento = data.data as Reconocimiento;
              this.modalRef = this.modalService.open(content);
            }
            else{
              this.openNotification('Error del servidor al guardar la informacion basica:'+data.message, 'error');

            }
        },
        error=>{

          this.openNotification('Error del servidor: '+error, 'error');
        });

      /*  this.modalRef.result.then((result) => {
          this.cleanForm();
          this.closeResult = `Closed with: ${result}`;
        }, (reason) => {
          this.cleanForm();
          this.closeResult = `Dismissed ${this.getDismissReason(reason)}`;
        });*/

    }


  }
  //buscamos el egresado por el tipo y numero de documento
  getEgresadoByDocument(){
    if(this.tipoDocToFind == '' || this.numeroDocToFind == ''){
      this.openNotification('Error de validacion: se debe seleccionar un tipo y un numero de documento', 'error');
    }else{

      let callBack = this.reconoService.getEgresadoByDocument(this.tipoDocToFind,this.numeroDocToFind);
      callBack.subscribe(res => {

          let data = res.json();
          let status = data.status;

          if(status == 'OK'){

            if(data.data.length > 0){
              let newEgresado = data.data[0];
              this.reconoEgresadoModel.idEgresado = newEgresado.idEgresado;
              this.reconoEgresadoModel.nombreEgresado = newEgresado.nombres;
              this.reconoEgresadoModel.apellidosEgresado = newEgresado.apellidos;
            }
            else{
              this.openNotification('No se encontro un egresado con el tipo y numero de documento','info');
            }


          }
          else{
            this.openNotification('Error al obtener el egresado, consultar con el administrador:'+data.message, 'error');

          }
      },
      error=>{

        this.openNotification('Error del servidor: '+error, 'error');
      });
    }

  }

  private getDismissReason(reason: any): string {
      if (reason === ModalDismissReasons.ESC) {

          return 'by pressing ESC';
      } else if (reason === ModalDismissReasons.BACKDROP_CLICK) {

          return 'by clicking on a backdrop';
      } else {

          return  `with: ${reason}`;
      }
  }
  cleanForm(){
    this.idEdit = "";

  }



  rerenderTable(): void {
    this.dtElement.dtInstance.then((dtInstance: DataTables.Api) => {
      // Destroy the table first
      dtInstance.destroy();
      this.idEdit = "";
      // Call the dtTrigger to rerender again
      this.dtTrigger.next();
    });
  }


  //SECCION DE  NOTIFICACIONES
  //AUTOR: CAMILO GIRALDO 2018
  //variables para los mensajes de notificacion
  titleNotification:string;
  messageNotification:string;
  iconNotification:string;
  colorAlert:string;
  //-------------------------------------------
  //METODO PARA ABRIR EL MODAL DE LA NOTIFICACION
  openNotification(messageComplement:string, type:string){


    let titleNot:string;
    let firstMessage:string;
    let classBox:string;
    let classIcon;
    let colorIcon;

    switch (type){
      case 'succes':
        titleNot = "Confirmación";
        firstMessage ="Registro exitoso.";
        classIcon = "fa fa-check-square-o";
        colorIcon = "green";
        classBox = "succes-msg";
      break;
      case 'info':
        titleNot = "Información";
        firstMessage ="";
        classIcon ="fa fa-exclamation-triangle";
        colorIcon = "#b0b01a";
        classBox = "info-msg";
      break;
      case 'error':
        titleNot = "Error";
        firstMessage ="Opps! ";
        classIcon ="fa fa-times";
        colorIcon="red";
        classBox = "error-msg";
      break;
    }

    this.titleNotification =titleNot;
    this.messageNotification = firstMessage + messageComplement;
    this.iconNotification = classIcon;
    this.colorAlert = colorIcon;
    this.modalService.open(this.modalNotification, { windowClass: classBox });

  }

}
