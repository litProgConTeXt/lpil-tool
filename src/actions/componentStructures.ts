

export class Components {

  pendingComponents : Set<string> = new Set()
  loadedComponents  : Set<string> = new Set()
  preambleLoaded    : boolean     = false
  postambleLoaded   : boolean     = false

  pending(aComponent : string) {
    this.pendingComponents.add(aComponent)
  }

  getPending() {
    return Array.from(this.pendingComponents.values())
  }

  loaded(aComponent : string) {
    if (this.pendingComponents.has(aComponent)) {
      this.pendingComponents.delete(aComponent)
    }
    this.loadedComponents.add(aComponent)
  }
}
