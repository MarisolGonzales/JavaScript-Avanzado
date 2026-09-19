import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalDetalleJuegoComponent } from './modal-detalle-juego.component';

describe('ModalDetalleJuegoComponent', () => {
  let component: ModalDetalleJuegoComponent;
  let fixture: ComponentFixture<ModalDetalleJuegoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ModalDetalleJuegoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModalDetalleJuegoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
