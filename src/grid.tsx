import * as React from 'react';
import ReactResizeDetector from 'react-resize-detector';
import jQuery from 'jquery';

interface GridProps<T> {
  data: T[];
  columnMappings: GridColumnMapping[],
  tableTitleHeight: number;
  container: HTMLElement | Window;
  searchKey: string;
  showAll: boolean;
}

interface GridColumnMapping {
  key: string,
  name: string,
  className: string
}

interface GridState<T> {
  data: T[];
  dataInViewport: T[];
  filter: string;
  rowHeight: number;
  viewportHeight: number;
  startIndex: number;
  endIndex: number;
  tableTitleFloat: boolean;
  gridOffsetTop: number;
  tableColumns: JSX.Element[];
}

class Grid<T> extends React.Component<GridProps<T>, GridState<T>> {

  private gridContainer: HTMLElement;
  private tableContainer: HTMLElement;

  private inRenderProcess: boolean = false;

  constructor(props) {
    super(props);
    let dataInViewport = [];
    if (props.data && props.data.length) {
      dataInViewport = props.data.slice(0, 1);
    }
    const tableColumns = this.props.columnMappings.map(c => {
      return <div className={'table-column ' + c.className}><label>{c.name}</label></div>;
    });
    this.state = {
      data: props.data || [],
      dataInViewport: dataInViewport,
      filter: '',
      rowHeight: 0,
      viewportHeight: 0,
      startIndex: 0,
      endIndex: 0,
      tableTitleFloat: false,
      gridOffsetTop: this.getContainerScrollY(),
      tableColumns,
    };
    this.onWindowScroll = this.onWindowScroll.bind(this);
    this.onResize = this.onResize.bind(this);
  }

  componentDidMount() {
    console.log('did mount');
    const filteredData = this.filterData(this.props.data, this.state.filter);
    const rowHeight = (document.querySelector('.table-row:first-child') as HTMLElement).offsetHeight;
    const gridOffsetTop = jQuery(this.gridContainer).offset().top;
    this.setState({
      data: filteredData,
      rowHeight,
      gridOffsetTop
    });
    this.calculateDataInViewport(filteredData, rowHeight);
    this.props.container.addEventListener('scroll', this.onWindowScroll);
    this.props.container.addEventListener('resize', this.onResize);
  }

  componentWillUnmount() {
    this.props.container.removeEventListener('scroll', this.onWindowScroll);
    this.props.container.removeEventListener('resize', this.onResize);
  }

  render() {
    const tableRows = [];

    if (this.state.rowHeight) {
      this.inRenderProcess = true;
      const tableTitleOffset = this.state.tableTitleFloat ? this.props.tableTitleHeight : 0;
      const pseudoPrefixRowHeight = this.state.startIndex * this.state.rowHeight + tableTitleOffset;
      tableRows.push(<div style={{height: pseudoPrefixRowHeight + 'px', width: '100%'}}></div>);
    }

    this.state.dataInViewport.forEach(d => {
      const columns = this.props.columnMappings.map(c => {
        return <div className={'table-column ' + c.className}>{d[c.key]}</div>;
      });
      tableRows.push(<div className="table-row">{columns}</div>);
    });

    if (this.state.rowHeight && this.state.data) {
      const pseudoSuffixRowHeight = (this.state.data.length - this.state.endIndex - 1) * this.state.rowHeight;
      tableRows.push(<div style={{height: pseudoSuffixRowHeight + 'px', width: '100%'}}></div>);
    }

    let titleClassName = 'table-header';
    if (this.state.tableTitleFloat) {
      titleClassName += ' float';
    }

    return (
      <div className="table" ref={this.setContainer.bind(this)}>
        <div className={titleClassName}>
          <h4 className="title">{'Infinite Table Demo'}</h4>
          <div className="filter-wrapper">
            <input
                type="text"
                value={this.state.filter}
                placeholder="Search"
                onChange={this.onFilterChange.bind(this)}
            />
          </div>
        </div>
        <div className="table-labels">
          {this.state.tableColumns}
        </div>
        <div className="table-rows" ref={this.setTableContainer.bind(this)}>
          {tableRows}
        </div>
      </div>
    );
  }

  private calculateDataInViewport(data: T[], rowHeight: number): void {
    if (this.props.showAll) {
      this.setState({
        startIndex: 0,
        endIndex: data.length - 1,
        dataInViewport: data
      });
      return;
    }
    if (!rowHeight) {
      return;
    }
    const tableTopOffset = jQuery(this.tableContainer).offset().top;
    const startIndex = Math.max(0, Math.floor((window.scrollY - tableTopOffset) / rowHeight) - 1);
    const endIndex = Math.min(
        Math.floor((window.innerHeight + (window.scrollY - tableTopOffset)) / rowHeight),
        data.length - 1
    );
    if (endIndex < startIndex || startIndex < 0) {
      return;
    }
    const dataInViewport = data.slice(startIndex, endIndex + 1);
    this.setState({
      startIndex,
      endIndex,
      dataInViewport
    });
  }

  private onWindowScroll() {
    // debugger;
    if (this.inRenderProcess) {
      this.inRenderProcess = false;
      return;
    }
    if (this.getContainerScrollY() >= this.state.gridOffsetTop) {
      this.setState({
        tableTitleFloat: true
      });
    } else {
      this.setState({
        tableTitleFloat: false
      });
    }
    this.calculateDataInViewport(this.state.data, this.state.rowHeight);
  }

  private getContainerScrollY() {
    if (this.props.container instanceof Window) {
      return this.props.container.scrollY;
    }
    return this.props.container.scrollTop;
  }

  private onResize() {
    console.log('resize');
    this.calculateDataInViewport(this.state.data, this.state.rowHeight);
  }

  private setContainer(elem: HTMLElement) {
    this.gridContainer = elem;
  }

  private setTableContainer(elem: HTMLElement) {
    this.tableContainer = elem;
  }

  private filterData(data: T[], query: string): T[] {
    if (!query) {
      return data;
    }
    const queryLowered = query.toLowerCase();
    return data.filter(v => {
      return String(v[this.props.searchKey]).toLowerCase().indexOf(queryLowered) !== -1;
    });
  }

  private onFilterChange(event) {
    let filterQuery: string = event.target.value;
    const newData = this.filterData(this.props.data, filterQuery);
    this.setState({
      filter: filterQuery,
      data: newData
    });
    this.calculateDataInViewport(newData, this.state.rowHeight);
  }

}

export {
  Grid
};
