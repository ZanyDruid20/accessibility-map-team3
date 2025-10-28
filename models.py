from sqlalchemy import Column, Integer, String, Float, Boolean, Enum, ForeignKey
from database import Base

class Node(Base):
    __tablename__ = "Nodes"

    node_id = Column(Integer, primary_key=True, index=True)
    type = Column(Enum('door', 'elevator', 'intersection'))
    threshold = Column(Integer)
    on_off = Column(Boolean)
    door_id = Column(String(100))
    elevator_id = Column(String(100))
    intersection_id = Column(String(100))


class Path(Base):
    __tablename__ = "Paths"

    path_id = Column(Integer, primary_key=True, index=True)
    threshold = Column(Float)
    on_off = Column(Boolean)
    time_sec = Column(Float)
    start_node = Column(Integer, ForeignKey("Nodes.node_id"))
    end_node = Column(Integer, ForeignKey("Nodes.node_id"))
