import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { BibliotecaRoutingModule } from './biblioteca-routing.module';
import { BibliotecaComponent } from './biblioteca.component';
import { SharedModule } from '../../shared/shared.module';

@NgModule({
  declarations: [
    BibliotecaComponent
  ],
  imports: [
    CommonModule,
    RouterModule,
    SharedModule,
    BibliotecaRoutingModule
  ]
})
export class BibliotecaModule { }
