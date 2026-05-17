/**
 * Version Control System for Smart Hub Games
 * Manages game versions with approval workflow
 */

class VersionControlSystem {
  constructor() {
    this.versions = {
      current: 'v1.0.0',
      available: [
        { version: 'v1.0.0', date: '2026-01-01', status: 'approved', changes: 'Initial release' },
        { version: 'v1.1.0', date: '2026-02-01', status: 'pending', changes: 'New features and bug fixes' },
        { version: 'v2.0.0', date: '2026-03-01', status: 'development', changes: 'Major redesign' }
      ],
      approved: ['v1.0.0'],
      blocked: []
    };
    
    this.loadVersions();
  }

  loadVersions() {
    const stored = localStorage.getItem('smart_hub_versions');
    if (stored) {
      try {
        this.versions = JSON.parse(stored);
      } catch (e) {
        console.warn('Failed to load versions');
      }
    }
  }

  saveVersions() {
    localStorage.setItem('smart_hub_versions', JSON.stringify(this.versions));
    window.dispatchEvent(new CustomEvent('versions-changed', { detail: this.versions }));
  }

  getCurrentVersion() {
    return this.versions.current;
  }

  setCurrentVersion(versionStr) {
    if (this.isApproved(versionStr)) {
      this.versions.current = versionStr;
      this.saveVersions();
      return true;
    }
    return false;
  }

  isApproved(versionStr) {
    return this.versions.approved.includes(versionStr);
  }

  approveVersion(versionStr) {
    if (!this.versions.approved.includes(versionStr)) {
      this.versions.approved.push(versionStr);
      this.saveVersions();
      return true;
    }
    return false;
  }

  rejectVersion(versionStr) {
    const idx = this.versions.approved.indexOf(versionStr);
    if (idx > -1) {
      this.versions.approved.splice(idx, 1);
      this.saveVersions();
      return true;
    }
    return false;
  }

  getVersionInfo(versionStr) {
    return this.versions.available.find(v => v.version === versionStr);
  }

  getAllVersions() {
    return this.versions.available;
  }

  canExecute() {
    return this.isApproved(this.versions.current);
  }

  getApprovedVersions() {
    return this.versions.approved;
  }
}

// Create global instance
window.versionControl = window.versionControl || new VersionControlSystem();
