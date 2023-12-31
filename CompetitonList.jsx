import React, { useEffect, useState } from 'react'
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import { Spinner, Table, Row, Col, InputGroup, Form, Button } from 'react-bootstrap';
import Pagination from "react-js-pagination";
import '../Pagination.css';

const CompetitonList = () => {

    const [competions, setCompetions] = useState([]);

    const getCompes = async () => {
        const url = `/books/list.json`;
        const res = await axios(url);
        console.log(res.data);
        setCompetions(res.data.list);

    }

    useEffect(() => {
        getCompes();
    }, []);


    return (
      
        <div className='my-5'> 공모전 목록 
        
        <Table>
                <thead>
                    <tr>
                        <th>공모전ID</th><td>제목</td><td>모집기간</td><td>상태</td>
                
                    </tr>
                </thead>
                   <tbody>
                    {competions.map(competion =>
                        <tr key={competion.cid}>
                            <td>{competion.cid}</td>
                            <td width="30%"><div className='ellipsis'>{competion.title}</div></td>
                            <td width="20%"><div className='ellipsis'>{competion.date1}</div></td>
                            <td>{competion.status1}</td>
            
                        </tr>
                    )}
                </tbody>
            </Table>
        
        
        
        
        
        
        
        
        
        
        
        
        
        </div>



    )
}

export default CompetitonList