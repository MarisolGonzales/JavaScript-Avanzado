import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { HistorialRoutingModule } from './historial-routing.module';
import { HistorialComponent } from './historial.component';
import { SharedModule } from '../../shared/shared.module';

@NgModule({
  declarations: [
    HistorialComponent
  ],
  imports: [
    CommonModule,
    RouterModule,
    SharedModule,
    HistorialRoutingModule
  ]
})
export class HistorialModule { }
