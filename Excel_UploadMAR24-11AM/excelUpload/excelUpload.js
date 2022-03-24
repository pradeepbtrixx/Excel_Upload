import { LightningElement, track, api } from 'lwc';
import { createRecord, updateRecord } from 'lightning/uiRecordApi';
import { loadScript } from 'lightning/platformResourceLoader';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { readAsBinaryString } from './readFile';
import SHEETJS_ZIP from '@salesforce/resourceUrl/sheetjs';
import updateProdList from '@salesforce/apex/productListsUpdation.productListsUpdationMeth';


export default class ExcelUpload extends LightningElement {    
    @api recordId;  
    @api objectApiName;

    @api title;
    @api label;

    @track ready = false;
    @track error = false;    

    @track uploading = false;
    @track uploadStep = 0;
    @track uploadMessage = '';
    @track uploadDone = false;
    @track uploadError = false;

    get loading() { return !this.ready && !this.error; }

    constructor() {
        super();

        loadScript(this, SHEETJS_ZIP + '/xlsx.full.min.js')
        .then(() => {
            if(!window.XLSX) {
                throw new Error('Error loading SheetJS library (XLSX undefined)');                
            }
            this.ready = true;
        })
        .catch(error => {
            this.error = error;
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Excel Upload: Error loading SheetJS',
                    message: error.message,
                    variant: 'error'
                })
            );
        });
    }

    uploadFile(evt) {
        const recordId = this.recordId;               
        let file;
        
        Promise.resolve(evt.target.files)        
        .then( files => {
            this.uploading = true;
            this.uploadStep = "1";
            this.uploadMessage = 'Reading File';
            this.uploadDone = false;
            this.uploadError = false;

            if(files.length !== 1) {
                throw new Error("Error accessing file -- " + 
                    (files.length === 0 ? 
                        'No file received' : 
                        'Multiple files received'
                    ));
            }        
 
            file = files[0];
            return readAsBinaryString(file);
        })                
        .then( blob => {
            this.uploadStep = "2";
            this.uploadMessage = 'Extracting Data';

            let workbook = window.XLSX.read(blob, {type: 'binary'});    

            if(!workbook || !workbook.Workbook) { throw new Error("Cannot read Excel File (incorrect file format?)"); }
            if(workbook.SheetNames.length < 1) { throw new Error("Excel file does not contain any sheets"); }            

            const record = {
                Id: recordId
            };

            const currecntOppId =  recordId;
            let sheetCompleteRows = [];
            for(let i=2; i<=5; i++) {
                let sheetrows = [];
                for (let x of ["A","B"]) {
                    let address = x+i;
                    let sheetName = workbook.SheetNames[0];                    
                    if(address.indexOf("!") >= 0) {
                        let parts = address.split("!");
                        sheetName = parts[0]; 
                        address = parts[1];
                    }

                    let sheet = workbook.Sheets[sheetName];
                    if(!sheet) { 
                        throw new Error(`Sheet '${sheetName} not found for Excel Address ${i}`); 
                    }

                    let cell = sheet[address];
                    if(!cell) {
                        throw new Error(`Cell with address ${address} not found for Excel Address ${i}`);
                    }
                    sheetrows.push(cell.v);
                }
                sheetCompleteRows.push(sheetrows);
            }
            console.log(sheetCompleteRows);
            updateProdList({oppRecordId : currecntOppId, jsValues : sheetCompleteRows});
            this.uploadStep = "3";
            this.uploadMessage = 'Updating Record';
            return updateRecord({fields: record}).then( () => blob );                        
        })
        .then( blob => {            
            this.uploadStep = "4";
            this.uploadMessage = 'Uploading File';

            const cv = {
                Title: file.name,
                PathOnClient: file.name,
                VersionData: window.btoa(blob),          
                FirstPublishLocationId: recordId
            };
            
            return createRecord({apiName: "ContentVersion", fields: cv})     
        })
        .then( _cv => {
            this.uploadMessage = "Done";  
            this.uploadDone = true;       
            return new Promise(function(resolve, _reject){ 
                window.setTimeout(resolve, 1000); 
            });             
        })
        .then( () => {
            this.closeModal();

            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Excel Upload: Success',
                    message: 'Current record has been updated successfully and the Excel file uploaded',
                    variant: 'success'
                })
            );             
        })
        .catch( err => {
            this.uploadError = true;
            this.uploadMessage = "Error: " + err.message;
        });
    }

    closeModal() {
        this.uploading = false;
        this.uploadStep = 0;
        this.uploadMessage = '';
        this.uploadDone = false;
        this.uploadError = false;       
    }
}