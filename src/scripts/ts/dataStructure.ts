export class SimpleMap<K, T> {

	recs: Array<[K, T]>;

	constructor(recs?: Array<[K, T]>) {
		this.recs = recs ? recs : new Array();
	}

	size(): number { return this.recs.length; }

	isEmpty(): boolean { return this.recs.length === 0; }

	removeAll(): void { this.recs = new Array(); }

	put(key: K, value: T): void {
		for (let i = 0; i < this.recs.length; i++) {
			if (this.recs[i][0] === key) {
				this.recs[i][1] = value;
				return;
			}
		}
		this.recs.push([key, value]);
	}

	get(key: K): (T | null) {
		for (let i = 0; i < this.recs.length; i++) {
			let r = this.recs[i];
			if (r[0] === key) {
				return r[1];
			}
		}
		return null;
	}

	remove(key: K): void {
		for (let i = 0; i < this.recs.length; i++) {
			if (this.recs[i][0] === key) {
				this.recs.splice(i, 1);
				return;
			}
		}
	}

	getElementByIndex(idx: number): ([K, T] | null) {
		if (idx < 0 || idx >= this.recs.length) {
			return null;
		}
		return this.recs[idx];
	}

	containsKey(key: K): boolean {
		for (let i = 0; i < this.recs.length; i++) {
			if (this.recs[i][0] === key) {
				return true;
			}
		}
		return false;
	}

	containsValue(value: T): boolean {
		for (let i = 0; i < this.recs.length; i++) {
			if (this.recs[i][1] === value) {
				return true;
			}
		}
		return false;
	}

	keys(): Array<K> {
		let arr: Array<K> = [];
		for (let i = 0; i < this.recs.length; i++) {
			arr.push(this.recs[i][0]);
		}
		return arr;
	}

	values(): Array<T> {
		let arr: Array<T> = [];
		for (let i = 0; i < this.recs.length; i++) {
			arr.push(this.recs[i][1]);
		}
		return arr;
	}

}

export class SimpleStack<T> {

	recs: Array<T>;

	constructor(recs?: Array<T>) {
		this.recs = recs ? recs : new Array();
	}

	push(...elems: Array<T>): void {
		for (let elem of elems) {
			this.recs.push(elem);
		}
	}

	/**
	 * 元素出栈，当堆栈为空时返回 null
	 */
	pop(): (T | null) {
		if (this.recs.length < 1) {
			return null;
		}
		let c = this.recs.pop();
		return c !== undefined ? c : null;
	}

	size(): number {
		return this.recs ? this.recs.length : 0;
	}

	isEmpty(): boolean {
		return this.recs.length < 1;
	}

	/**
	 * 返回栈顶元素，若堆栈为空则返回 null
	 */
	getTop(): (T | null) {
		if (this.recs.length < 1) {
			return null;
		}
		return this.recs[this.recs.length - 1];
	}

	removeAll(): void {
		this.recs = new Array();
	}

	toString(): string {
		let arr: Array<T> = new Array();
		if (this.recs.length > 0) {
			for (let i = this.recs.length - 1; i > -1; i--) {
				arr.push(this.recs[i]);
			}
		}
		return arr.toString();
	}

}


export class SimpleQueue<T> {

	recs: Array<T>;

	constructor(recs?: Array<T>) {
		this.recs = recs ? recs : new Array();
	}

	push(...elems: Array<T>): void {
		for (let elem of elems) {
			this.recs.push(elem);
		}
	}

	/**
	 * 元素出队，当队列为空时返回 null
	 */
	pop(): (T | null) {
		if (this.recs.length < 1) {
			return null;
		}
		let c = this.recs.shift();
		return c !== undefined ? c : null;
	}

	size(): number {
		return this.recs ? this.recs.length : 0;
	}

	isEmpty(): boolean {
		return this.recs.length < 1;
	}

	/**
	 * 返回队首元素，若队列为空则返回 null
	 */
	getHead(): (T | null) {
		if (this.recs.length < 1) {
			return null;
		}
		return this.recs[0];
	}

	getTail(): (T | null) {
		if (this.recs.length < 1) {
			return null;
		}
		return this.recs[this.recs.length - 1];
	}

	removeAll(): void {
		this.recs = new Array();
	}

	toString(): string {
		let arr: Array<T> = new Array();
		if (this.recs.length > 0) {
			for (let i = 0; i < this.recs.length; i++) {
				arr.push(this.recs[i]);
			}
		}
		return arr.toString();
	}
}
