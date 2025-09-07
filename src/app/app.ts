import { Component, OnInit, signal, computed, effect, inject, PLATFORM_ID } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Timezone {
  identifier: string;
  name: string;
}

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CommonModule, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);
  
  calendarUrl = signal('');
  selectedTimezone = signal('America/New_York');
  timezoneSearch = signal('');
  showDropdown = signal(false);
  selectedWeek = signal<'this' | 'next' | 'custom'>('this');
  customDate = signal('');
  generatedLink = computed(() => this.generateLink());
  recentTimezones = signal<string[]>([]);
  
  // PWA install prompt
  showInstallPrompt = signal(false);
  private deferredPrompt: any;
  
  filteredTimezones = computed(() => {
    const search = this.timezoneSearch().toLowerCase();
    // Show all timezones if search matches the current selection or is empty
    const currentTz = this.timezones.find(tz => tz.identifier === this.selectedTimezone());
    if (!search || (currentTz && search === currentTz.name.toLowerCase())) {
      return this.timezones;
    }
    
    return this.timezones.filter(tz => 
      tz.name.toLowerCase().includes(search) || 
      tz.identifier.toLowerCase().includes(search)
    );
  });

  // Popular timezones from tz database
  timezones: Timezone[] = [
    { identifier: 'America/New_York', name: 'New York (Eastern)' },
    { identifier: 'America/Chicago', name: 'Chicago (Central)' },
    { identifier: 'America/Denver', name: 'Denver (Mountain)' },
    { identifier: 'America/Los_Angeles', name: 'Los Angeles (Pacific)' },
    { identifier: 'America/Phoenix', name: 'Phoenix (Arizona)' },
    { identifier: 'America/Anchorage', name: 'Anchorage (Alaska)' },
    { identifier: 'Pacific/Honolulu', name: 'Honolulu (Hawaii)' },
    { identifier: 'Europe/London', name: 'London' },
    { identifier: 'Europe/Paris', name: 'Paris' },
    { identifier: 'Europe/Berlin', name: 'Berlin' },
    { identifier: 'Asia/Tokyo', name: 'Tokyo' },
    { identifier: 'Asia/Shanghai', name: 'Shanghai' },
    { identifier: 'Asia/Dubai', name: 'Dubai' },
    { identifier: 'Australia/Sydney', name: 'Sydney' },
    { identifier: 'America/Toronto', name: 'Toronto' },
    { identifier: 'America/Mexico_City', name: 'Mexico City' },
    { identifier: 'America/Sao_Paulo', name: 'São Paulo' },
    { identifier: 'Asia/Kolkata', name: 'Kolkata (India)' },
    { identifier: 'Asia/Singapore', name: 'Singapore' },
    { identifier: 'Pacific/Auckland', name: 'Auckland' }
  ];

  constructor() {
    if (this.isBrowser) {
      // Save calendar URL to localStorage whenever it changes
      effect(() => {
        const url = this.calendarUrl();
        if (url) {
          localStorage.setItem('googleCalendarUrl', url);
        }
      });
      
      // Save selected timezone to localStorage whenever it changes
      effect(() => {
        const tz = this.selectedTimezone();
        if (tz) {
          localStorage.setItem('selectedTimezone', tz);
        }
      });
    }
  }

  ngOnInit() {
    if (this.isBrowser) {
      // Load saved calendar URL from localStorage
      const savedUrl = localStorage.getItem('googleCalendarUrl');
      if (savedUrl) {
        this.calendarUrl.set(savedUrl);
      }
      
      // Load saved timezone from localStorage
      const savedTimezone = localStorage.getItem('selectedTimezone');
      if (savedTimezone) {
        this.selectedTimezone.set(savedTimezone);
        // Set the search field to show the selected timezone name
        const tz = this.timezones.find(t => t.identifier === savedTimezone);
        if (tz) {
          this.timezoneSearch.set(tz.name);
        }
      } else {
        // Set default timezone name in search field
        this.timezoneSearch.set('New York (Eastern)');
      }
      
      // Load recent timezones from localStorage
      const savedRecent = localStorage.getItem('recentTimezones');
      if (savedRecent) {
        try {
          const recent = JSON.parse(savedRecent);
          this.recentTimezones.set(recent);
        } catch (e) {
          this.recentTimezones.set([]);
        }
      }
      
      // Set default custom date to today
      const today = new Date();
      this.customDate.set(this.formatDateForInput(today));
      
      // Listen for PWA install prompt
      window.addEventListener('beforeinstallprompt', (e: Event) => {
        e.preventDefault();
        this.deferredPrompt = e;
        this.showInstallPrompt.set(true);
      });
      
      // Check if app is already installed (PWA)
      if ((window as any).matchMedia('(display-mode: standalone)').matches) {
        this.showInstallPrompt.set(false);
      }
    }
  }
  
  private formatDateForInput(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  updateCalendarUrl(event: Event) {
    const input = event.target as HTMLInputElement;
    this.calendarUrl.set(input.value);
  }

  updateTimezoneSearch(event: Event) {
    const input = event.target as HTMLInputElement;
    this.timezoneSearch.set(input.value);
    this.showDropdown.set(true);
  }

  selectTimezone(timezone: Timezone) {
    this.selectedTimezone.set(timezone.identifier);
    this.timezoneSearch.set(timezone.name);
    this.showDropdown.set(false);
    this.updateRecentTimezones(timezone.identifier);
  }
  
  selectRecentTimezone(identifier: string) {
    const tz = this.timezones.find(t => t.identifier === identifier);
    if (tz) {
      this.selectTimezone(tz);
    }
  }
  
  private updateRecentTimezones(identifier: string) {
    if (!this.isBrowser) return;
    
    const recent = this.recentTimezones();
    // Remove if already exists
    const filtered = recent.filter(id => id !== identifier);
    // Add to beginning
    const updated = [identifier, ...filtered].slice(0, 4);
    this.recentTimezones.set(updated);
    // Save to localStorage
    localStorage.setItem('recentTimezones', JSON.stringify(updated));
  }
  
  getTimezoneName(identifier: string): string {
    const tz = this.timezones.find(t => t.identifier === identifier);
    return tz ? tz.name : identifier;
  }

  onTimezoneFocus(event: FocusEvent) {
    this.showDropdown.set(true);
    // Select all text when focusing the input
    const input = event.target as HTMLInputElement;
    input.select();
  }

  onTimezoneBlur() {
    // Delay to allow click on dropdown item
    setTimeout(() => this.showDropdown.set(false), 200);
  }

  selectWeek(week: 'this' | 'next' | 'custom') {
    this.selectedWeek.set(week);
  }
  
  updateCustomDate(event: Event) {
    const input = event.target as HTMLInputElement;
    this.customDate.set(input.value);
  }
  
  getMinDate(): string {
    return this.formatDateForInput(new Date());
  }
  
  getMaxDate(): string {
    const maxDate = new Date();
    maxDate.setFullYear(maxDate.getFullYear() + 1);
    return this.formatDateForInput(maxDate);
  }

  private getWeekDates(week: 'this' | 'next' | 'custom'): { start: string; end: string } {
    let baseDate = new Date();
    
    if (week === 'custom' && this.customDate()) {
      // Parse the custom date
      const parts = this.customDate().split('-');
      baseDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    }
    
    const currentDay = baseDate.getDay();
    const daysToMonday = currentDay === 0 ? -6 : 1 - currentDay;
    
    const monday = new Date(baseDate);
    monday.setDate(baseDate.getDate() + daysToMonday);
    
    if (week === 'next') {
      monday.setDate(monday.getDate() + 7);
    }
    
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    
    const formatDate = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}${month}${day}`;
    };
    
    return {
      start: formatDate(monday),
      end: formatDate(sunday)
    };
  }

  private generateLink(): string {
    const url = this.calendarUrl();
    if (!url) return '';
    
    // Extract base URL without any existing parameters
    const baseUrl = url.split('&')[0];
    const dates = this.getWeekDates(this.selectedWeek());
    
    return `${baseUrl}&ctz=${this.selectedTimezone()}&mode=week&dates=${dates.start}%2F${dates.end}`;
  }

  async copyToClipboard() {
    const link = this.generatedLink();
    if (!link) return;
    
    try {
      await navigator.clipboard.writeText(link);
      // Could add a toast notification here
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }

  openInNewTab() {
    const link = this.generatedLink();
    if (!link) return;
    
    window.open(link, '_blank');
  }
  
  async installPWA() {
    if (!this.deferredPrompt) return;
    
    this.deferredPrompt.prompt();
    const { outcome } = await this.deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('PWA installed');
    }
    
    this.deferredPrompt = null;
    this.showInstallPrompt.set(false);
  }
  
  dismissInstallPrompt() {
    this.showInstallPrompt.set(false);
    // Store dismissal in localStorage to not show again for some time
    if (this.isBrowser) {
      const dismissTime = new Date().getTime();
      localStorage.setItem('pwaInstallDismissed', dismissTime.toString());
    }
  }
}
