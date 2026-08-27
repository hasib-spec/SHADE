import torch
import torch.nn as nn

class InterventionSurrogateNet(nn.Module):
    """
    PyTorch multi-layer perceptron for predicting cooling delta.
    Architecture:
    Linear(10, 64) -> BatchNorm1d(64) -> ReLU -> Dropout(0.1) -> 
    Linear(64, 32) -> ReLU -> 
    Linear(32, 16) -> ReLU -> 
    Linear(16, 1)
    """
    def __init__(self):
        super(InterventionSurrogateNet, self).__init__()
        self.fc1 = nn.Linear(10, 64)
        self.bn1 = nn.BatchNorm1d(64)
        self.relu1 = nn.ReLU()
        self.drop1 = nn.Dropout(0.1)
        
        self.fc2 = nn.Linear(64, 32)
        self.relu2 = nn.ReLU()
        
        self.fc3 = nn.Linear(32, 16)
        self.relu3 = nn.ReLU()
        
        self.fc4 = nn.Linear(16, 1)

    def forward(self, x):
        x = self.fc1(x)
        x = self.bn1(x)
        x = self.relu1(x)
        x = self.drop1(x)
        
        x = self.fc2(x)
        x = self.relu2(x)
        
        x = self.fc3(x)
        x = self.relu3(x)
        
        x = self.fc4(x)
        return x
