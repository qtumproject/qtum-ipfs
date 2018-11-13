pragma solidity ^0.4.24;
contract IpfsRecord {
    string[] records;

    function add(string data) external {
        records.push(data);
    }
    
    function getIndex() public view returns (uint) {
        return records.length;
    }
    
    function get(uint index) public view returns (string) {
        return records[index];
    }
}