import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
    ReactiveFormsModule,
    FormsModule
} from '@angular/forms';

import { LoginRoutingModule } from './login-routing.module';
import { LoginComponent } from './login.component';

import { AuthenticationService } from '../_services/authentication.service';

@NgModule({
    imports: [CommonModule, LoginRoutingModule,  ReactiveFormsModule,
      FormsModule],
    declarations: [LoginComponent]
})
export class LoginModule {}
