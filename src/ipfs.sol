pragma solidity ^0.4.24;
contract ipfs{
 string[] records;
 address[] addr;
 uint256 index = 0;
 
 function sendHash(string recordData) public {
     records.push(recordData);
     addr.push(msg.sender);
     index++;
 }
 
 function getIndex() public view returns (uint256 resIndex){
     resIndex = index;
     return resIndex;
 }
 function getRecord(uint256 _index) public view returns (string oneRecord) {
   oneRecord = records[_index];
   return oneRecord;
 }
 function getAddressArr() public view returns (address[] addrArr){
     addrArr = addr;
     return addrArr;
 }
}