import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

import { SoporteRoutingModule } from './soporte-routing.module';
import { SoporteComponent } from './soporte.component';
import { SharedModule } from '../../shared/shared.module';

@NgModule({
  declarations: [
    SoporteComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    SharedModule,
    SoporteRoutingModule
  ]
})
export class SoporteModule { }
