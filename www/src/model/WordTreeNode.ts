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
}

export default WordTreeNode;