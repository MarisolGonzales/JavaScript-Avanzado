import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { CatalogoRoutingModule } from './catalogo-routing.module';
import { CatalogoComponent } from './catalogo.component';
import { SharedModule } from '../../shared/shared.module';

@NgModule({
  declarations: [
    CatalogoComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    SharedModule,
    CatalogoRoutingModule
  ]
})
export class CatalogoModule { }
