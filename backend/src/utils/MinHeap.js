export class MinHeap {
  /**
   * @param {function(*): number} [getPriority=(item) => item] - Optional function to extract numeric priority key
   */
  constructor(getPriority = (item) => item) {
    // Index 0 is a dummy element to enable 1-based indexing
    this.heap = [null];
    this.getPriority = getPriority;
  }

  get size() {
    return this.heap.length - 1;
  }

  peek() {
    return this.heap[1] ?? null;
  }

  push(item) {
    this.heap.push(item);
    this.#siftUp(this.size);
  }

  pop() {
    if (this.size === 0) return null;
    if (this.size === 1) return this.heap.pop();

    const top = this.heap[1];
    this.heap[1] = this.heap.pop();
    this.#siftDown(1);
    return top;
  }

  remove(targetId, getId = (item) => item?.id) {
    // Preserve the null at index 0 while filtering elements
    this.heap = [
      null,
      ...this.heap.slice(1).filter((item) => getId(item) !== targetId),
    ];
    this.#heapify();
  }

  // Returns the priority value for heap comparison
  #val(index) {
    return this.getPriority(this.heap[index]);
  }

  #siftUp(i) {
    while (i > 1) {
      const parent = Math.floor(i / 2); // Clean 1-based parent calculation
      if (this.#val(i) >= this.#val(parent)) break;

      [this.heap[i], this.heap[parent]] = [this.heap[parent], this.heap[i]];
      i = parent;
    }
  }

  #siftDown(i) {
    const len = this.size;
    while (true) {
      let smallest = i;
      const left = 2 * i; // 1-based left child
      const right = 2 * i + 1; // 1-based right child

      if (left <= len && this.#val(left) < this.#val(smallest)) {
        smallest = left;
      }
      if (right <= len && this.#val(right) < this.#val(smallest)) {
        smallest = right;
      }

      if (smallest === i) break;

      [this.heap[i], this.heap[smallest]] = [this.heap[smallest], this.heap[i]];
      i = smallest;
    }
  }

  #heapify() {
    for (let i = Math.floor(this.size / 2); i >= 1; i--) {
      this.#siftDown(i);
    }
  }
}
