/**
 * 
 */
export class SimpleMap<K, T> {

	recs: Array<[K, T]>;

	constructor(recs?: Array<[K, T]>) {
		this.recs = recs ? recs : new Array();
	}

	/**
	 * 
	 * @returns 
	 */
	size(): number { return this.recs.length; }

	isEmpty(): boolean { return null == this.recs || this.recs.length == 0; }

	/**
	 * 
	 */
	removeAll(): void { this.recs = new Array(); }

	/**
	 * 
	 * @param key 
	 * @param value 
	 */
	put(key: K, value: T): void { this.recs.push([key, value]); }

	/**
	 * 
	 */
	get(key: K): (T | null) {
		if (null == this.recs || this.recs.length < 1) {
			return null;
		}
		for (let i = 0; i < this.recs.length; i++) {
			let r = this.recs[i];
			if (r[0] === key) {
				return r[1];
			}
		}
		return null;
	}

	/**
	 * 
	 * @param key 
	 */
	remove(key: K): void {
		let newRecs = new Array();
		for (let i = 0; i < this.recs.length; i++) {
			let r = this.recs[i];
			if (key != r[0]) { newRecs.push(r); }
		}
		this.recs = newRecs;
	}

	/**
	 * 
	 * @param idx 
	 * @returns 
	 */
	getElementByIndex(idx: number): ([K, T] | null) {
		if (null == this.recs || idx < 0 || idx >= this.recs.length) {
			return null;
		} else {
			return this.recs[idx];
		}
	}

	/**
	 * 
	 * @param key 
	 * @returns 
	 */
	containsKey(key: K): boolean {
		if (null == this.recs || this.recs.length < 1) {
			return false;
		}
		for (let i = 0; i < this.recs.length; i++) {
			let r = this.recs[i];
			if (r[0] === key) {
				return true;
			}
		}
		return false;
	}

	/**
	 * 
	 * @param value
	 * @returns 
	 */
	containsValue(value: T): boolean {
		if (null == this.recs || this.recs.length < 1) {
			return false;
		}
		for (let i = 0; i < this.recs.length; i++) {
			let r = this.recs[i];
			if (r[1] === value) {
				return true;
			}
		}
		return false;
	}

	/**
	 * 
	 * @returns 
	 */
	keys(): Array<K> {
		let arr: Array<K> = [];
		for (let i = 0; i < this.recs.length; i++) {
			let r = this.recs[i];
			arr.push(r[0]);
		}
		return arr;
	}


	/**
	 * 
	 * @returns 
	 */
	values(): Array<T> {
		let arr: Array<T> = [];
		for (let i = 0; i < this.recs.length; i++) {
			let r = this.recs[i];
			arr.push(r[1]);
		}
		return arr;
	}

}

export class SimpleStack<T> {

	recs: Array<T>;

	constructor(recs?: Array<T>) {
		this.recs = recs ? recs : new Array();
	}

	/**
	 * 
	 * @param elems 
	 * @returns 
	 */
	push(...elems: Array<T>): void {
		if (!elems || elems.length < 1) {
			return;
		}
		if (!this.recs) {
			this.recs = new Array();
		}
		for (let elem of elems) {
			this.recs.push(elem);
		}
	}

	/**
		 * 元素出栈 当堆栈元素为空时,返回null
	 * 
	 * @returns 
	 */
	pop(): (T | null) {
		if (!this.recs || this.recs.length < 1) {
			return null;
		} else {
			let c = this.recs.pop();
			return c ? c : null;
		}
	}

	/**
	 * 
	 * @returns 
	 */
	size(): number {
		return this.recs ? this.recs.length : 0;
	}

	isEmpty(): boolean {
		return !this.recs || this.recs.length < 1;
	}

	/**
		 * 返回栈顶元素值 若堆栈为空则返回null
	 * 
	 * @returns 
	 */
	getTop(): (T | null) {
		if (!this.recs || this.recs.length < 1) {
			return null;
		} else {
			return this.recs[this.recs.length - 1];
		}
	}

	/**
	 * 
	 */
	removeAll(): void {
		this.recs = new Array();
	}

	/**
	 * 
	 * @returns 
	 */
	toString(): string {
		let arr: Array<T> = new Array();
		if (this.recs && this.recs.length > 0) {
			for (let i = this.recs.length - 1; i > -1; i--) {
				let r = this.recs[i]
				arr.push(r);
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

	/**
	 * 
	 * @param elems 
	 * @returns 
	 */
	push(...elems: Array<T>): void {
		if (!elems || elems.length < 1) {
			return;
		}
		if (!this.recs) {
			this.recs = new Array();
		}
		for (let elem of elems) {
			this.recs.push(elem);
		}
	}

	/**
	 * 元素出 当堆栈元素为空时,返回null
	 * 
	 * @returns 
	 */
	pop(): (T | null) {
		if (!this.recs || this.recs.length < 1) {
			return null;
		} else {
			let c = this.recs.shift();
			return c ? c : null;
		}
	}

	/**
	 * 
	 * @returns 
	 */
	size(): number {
		return this.recs ? this.recs.length : 0;
	}

	isEmpty(): boolean {
		return !this.recs || this.recs.length < 1;
	}

	/**
	 * 返回栈元素值 若堆栈为空则返回null
	 * 
	 * @returns 
	 */
	getHead(): (T | null) {
		if (!this.recs || this.recs.length < 1) {
			return null;
		} else {
			return this.recs[0];
		}
	}

	/**
	 * 
	 * @returns 
	 */
	getTail(): (T | null) {
		if (!this.recs || this.recs.length < 1) {
			return null;
		} else {
			return this.recs[this.recs.length - 1];
		}
	}

	/**
	 * 
	 */
	removeAll(): void {
		this.recs = new Array();
	}

	/**
	 * 
	 * @returns 
	 */
	toString(): string {
		let arr: Array<T> = new Array();
		if (this.recs && this.recs.length > 0) {
			for (let i = 0; i < this.recs.length; i++) {
				let r = this.recs[i]
				arr.push(r);
			}
		}
		return arr.toString();
	}
}
