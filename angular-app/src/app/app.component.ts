import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  activeTab: string = 'url';
  qrCodeUrl: string = '';
  isLoading: boolean = false;
  errorMessage: string = '';
  private generateTimeout: any = null;
  autoGenerate: boolean = true;

  // Form data
  urlInput: string = '';
  textInput: string = '';
  emailInput: string = '';
  emailSubject: string = '';
  emailBody: string = '';
  phoneInput: string = '';
  wifiSSID: string = '';
  wifiPassword: string = '';
  wifiSecurity: string = 'WPA';

  // Customization options
  width: number = 1000;
  errorLevel: string = 'H';
  margin: number = 1;
  darkColor: string = '#000000';
  lightColor: string = '#FFFFFF';

  setActiveTab(tab: string): void {
    this.activeTab = tab;
    this.errorMessage = '';
    this.qrCodeUrl = '';
    if (this.autoGenerate) {
      this.autoGenerateQRCode();
    }
  }

  generateQRCode(suppressErrors: boolean = false): void {
    let data = '';

    // Build data based on active tab
    switch (this.activeTab) {
      case 'url':
        data = this.urlInput.trim();
        if (!data) {
          if (!suppressErrors) {
            this.showError('Please enter a URL');
          }
          this.qrCodeUrl = '';
          return;
        }
        break;
      case 'text':
        data = this.textInput.trim();
        if (!data) {
          if (!suppressErrors) {
            this.showError('Please enter some text');
          }
          this.qrCodeUrl = '';
          return;
        }
        break;
      case 'email':
        const email = this.emailInput.trim();
        if (!email) {
          if (!suppressErrors) {
            this.showError('Please enter an email address');
          }
          this.qrCodeUrl = '';
          return;
        }
        const subject = this.emailSubject.trim();
        const body = this.emailBody.trim();
        data = `mailto:${email}${subject ? '?subject=' + encodeURIComponent(subject) : ''}${body ? (subject ? '&' : '?') + 'body=' + encodeURIComponent(body) : ''}`;
        break;
      case 'phone':
        const phone = this.phoneInput.trim();
        if (!phone) {
          if (!suppressErrors) {
            this.showError('Please enter a phone number');
          }
          this.qrCodeUrl = '';
          return;
        }
        data = `tel:${phone}`;
        break;
      case 'wifi':
        const ssid = this.wifiSSID.trim();
        if (!ssid) {
          if (!suppressErrors) {
            this.showError('Please enter a network name');
          }
          this.qrCodeUrl = '';
          return;
        }
        const password = this.wifiPassword.trim();
        data = `WIFI:T:${this.wifiSecurity};S:${ssid};P:${password};H:false;;`;
        break;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.qrCodeUrl = '';

    // Build query string
    const params = new URLSearchParams({
      data: data,
      width: this.width.toString(),
      errorCorrectionLevel: this.errorLevel,
      margin: this.margin.toString(),
      darkColor: this.darkColor,
      lightColor: this.lightColor
    });

    const apiUrl = `/api/generate?${params.toString()}`;

    // Create image to test if it loads
    const img = new Image();
    img.onload = () => {
      this.qrCodeUrl = apiUrl;
      this.isLoading = false;
    };
    img.onerror = () => {
      this.showError('Failed to generate QR code. Please check your input and try again.');
      this.isLoading = false;
    };
    img.src = apiUrl;
  }

  downloadQRCode(): void {
    if (this.qrCodeUrl) {
      const link = document.createElement('a');
      link.href = this.qrCodeUrl;
      link.download = 'qrcode.png';
      link.click();
    }
  }

  onDarkColorChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.darkColor = input.value.toUpperCase();
    if (this.autoGenerate) {
      this.autoGenerateQRCode();
    }
  }

  onLightColorChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.lightColor = input.value.toUpperCase();
    if (this.autoGenerate) {
      this.autoGenerateQRCode();
    }
  }

  showError(message: string): void {
    this.errorMessage = message;
    this.isLoading = false;
  }

  incrementWidth(): void {
    this.width = Math.min(this.width + 100, 5000);
    if (this.autoGenerate) {
      this.autoGenerateQRCode();
    }
  }

  decrementWidth(): void {
    this.width = Math.max(this.width - 100, 1000);
    if (this.autoGenerate) {
      this.autoGenerateQRCode();
    }
  }

  incrementMargin(): void {
    this.margin = Math.min(this.margin + 1, 10);
    if (this.autoGenerate) {
      this.autoGenerateQRCode();
    }
  }

  decrementMargin(): void {
    this.margin = Math.max(this.margin - 1, 1);
    if (this.autoGenerate) {
      this.autoGenerateQRCode();
    }
  }

  autoGenerateQRCode(): void {
    // Clear existing timeout
    if (this.generateTimeout) {
      clearTimeout(this.generateTimeout);
    }

    // Debounce: wait 500ms after user stops typing
    this.generateTimeout = setTimeout(() => {
      this.generateQRCode(true); // Suppress errors for auto-generation
    }, 500);
  }

  onInputChange(): void {
    if (this.autoGenerate) {
      this.autoGenerateQRCode();
    }
  }

  onCustomizationChange(): void {
    if (this.autoGenerate && this.hasValidInput()) {
      this.autoGenerateQRCode();
    }
  }

  hasValidInput(): boolean {
    switch (this.activeTab) {
      case 'url':
        return this.urlInput.trim().length > 0;
      case 'text':
        return this.textInput.trim().length > 0;
      case 'email':
        return this.emailInput.trim().length > 0;
      case 'phone':
        return this.phoneInput.trim().length > 0;
      case 'wifi':
        return this.wifiSSID.trim().length > 0;
      default:
        return false;
    }
  }

}
