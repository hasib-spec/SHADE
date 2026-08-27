import pytest

def solve_knapsack(items, budget):
    """
    Simplified greedy knapsack solver for testing.
    items: list of dicts with 'id', 'cost', 'ces'
    budget: float
    """
    # Sort by Cost-Effectiveness Score descending
    sorted_items = sorted(items, key=lambda x: x['ces'], reverse=True)
    
    selected = []
    current_cost = 0
    
    for item in sorted_items:
        if current_cost + item['cost'] <= budget:
            selected.append(item)
            current_cost += item['cost']
            
    return selected, current_cost

def test_greedy_knapsack():
    items = [
        {'id': 1, 'cost': 1000, 'ces': 50},
        {'id': 2, 'cost': 500, 'ces': 80},
        {'id': 3, 'cost': 800, 'ces': 60}
    ]
    budget = 1500
    
    selected, total_cost = solve_knapsack(items, budget)
    
    # Should pick id 2 (ces 80, cost 500), then id 3 (ces 60, cost 800). Total 1300.
    assert len(selected) == 2
    assert selected[0]['id'] == 2
    assert selected[1]['id'] == 3
    assert total_cost == 1300
