def exp_solver(chromosome,requests,available_cars):
    time_table = [[] for _ in available_cars]
    for i,request in enumerate(requests):
        if i < len(available_cars):
            time_table[i].append(request)
            assigned = True
            break
        else:
            last_task = car_se
        
    return fitness
