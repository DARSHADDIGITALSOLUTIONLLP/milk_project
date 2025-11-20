import React from 'react';
import { Link } from 'react-router-dom';
import { Container, Row, Col, Card  } from 'react-bootstrap';
import mauli_logo from '/mauli_logo.png';
import './Dashboard.css';

function CardComponent({ title, color }) {
  return (
    <Card style={{ width: '174px', backgroundColor: color, height: '97px', color: 'white', margin: '10px auto' }} className='text-center h4 card-component'>
      <Card.Body>
        <Card.Title style={{position: 'relative', top: '20px'}}>
            <center>
                <a href="" style={{textDecoration: 'none', color: 'white',display: 'block', width: '155px',height: '40px'}} >{title}</a>
            </center>
            </Card.Title>
      </Card.Body>
    </Card>
  );
}

function Superadmin() {
  return (
    <div className="login-container">
      <Container fluid>
        <Row className="login-row">
          <Col md="6" className="image-col">
            <div className="image-wrapper">
              <img src={mauli_logo} className="img-fluid" alt="mauli_logo" />
            </div>
          </Col>
          <Col md="6" className="form-col">
            <Container>
              <Row>
                <Col md="12">
                  <p className='h4 text-center'>Welcome to our product</p>
                  <div className='d-flex flex-column align-items-center'>
                  <Link to="/dairy-registration" style={{textDecoration:'none'}}><CardComponent title='Super admin' color='#0361FE' /></Link>
                  {/* <Link to="/admin-dashboard" style={{textDecoration:'none'}}> <CardComponent title='Admin' color='#EF6E0B' /></Link> */}
                  {/* <Link to="/user-dashboard" style={{textDecoration:'none'}}> <CardComponent title='User' color='#DD0BEF' /></Link> */}
                  </div>
                </Col>
              </Row>
            </Container>
          </Col>
        </Row>
      </Container>
    </div>
  );
}

export default Superadmin;
