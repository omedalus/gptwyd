class WordTreeNode {
  public parent = null as WordTreeNode | null;

  public word = '';
  public probability = 1;

  public children = [] as WordTreeNode[];

  public haveChildrenBeenPopulated = false;

  public get cumulativeProbability() {
    let retval = this.probability;
    if (this.parent) {
      retval *= this.parent.cumulativeProbability;
    }
    return retval;
  };

  public get cumulativeText() {
    let retval = '';
    if (this.parent) {
      retval = this.parent.cumulativeText;
    }
    retval += this.word;
    return retval;
  }

  public _getDescendantTextsRecursive(accumulator: string, results: string[], skipself?: boolean) {
    if (!skipself) {
    accumulator += this.word;
    }

    if (!this.children.length) {
      results.push(accumulator);
    } else {
      this.children.forEach((child) => {
        child._getDescendantTextsRecursive(accumulator, results);
      });
    }
    return results;
  }

  public get descendantTexts() {
    return this._getDescendantTextsRecursive('', [], true);
  }
}

export default WordTreeNode;