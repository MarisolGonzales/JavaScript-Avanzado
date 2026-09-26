import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

import { PerfilRoutingModule } from './perfil-routing.module';
import { PerfilComponent } from './perfil.component';
import { SharedModule } from '../../shared/shared.module';

@NgModule({
  declarations: [
    PerfilComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    SharedModule,
    PerfilRoutingModule
  ]
})
export class PerfilModule { }
